import * as vscode from 'vscode';
import * as path from 'path';
import sharp from 'sharp';
import { promptForAllInputs, promptForImageFiles } from './prompts';
import { processImage, ProcessImageResult } from './images';
import { config } from './extension';

/**
 * Helper to generate output file name.
 */
function getOutputFileName(imagePath: string, outputDir: string, itemName: string, size: number): string {
    return path.join(outputDir, `${itemName}_${size}${path.extname(imagePath)}`);
}

/**
 * Command: Generate responsive images
 */
export const disposable = vscode.commands.registerCommand(
    'responsive-image-generator.generate',
    async (resourceUri?: vscode.Uri): Promise<void> => {
        try {
            const result = await promptForAllInputs(resourceUri ? [resourceUri] : undefined);
            if (!result) return;

            const { imageUris, outputDir, sizesToGenerate } = result;
            let allErrors: string[] = [];

            await vscode.window.withProgress(
                {
                    location: vscode.ProgressLocation.Notification,
                    title: 'Generating responsive images...',
                    cancellable: false,
                },
                async (progress) => {
                    let completed = 0;
                    const total = imageUris.length;
                    for (const imageUri of imageUris) {
                        const itemName = path.basename(
                            imageUri.fsPath,
                            path.extname(imageUri.fsPath)
                        );
                        const imageResult: ProcessImageResult = await processImage(
                            imageUri.fsPath,
                            outputDir,
                            itemName,
                            sizesToGenerate
                        );
                        if (imageResult.errors.length > 0) {
                            allErrors.push(
                                ...imageResult.errors.map(e =>
                                    `File: ${imageUri.fsPath}, Size: ${e.size}px, Error: ${e.error}`
                                )
                            );
                        }
                        completed++;
                        progress.report({ message: `Processed ${completed} of ${total}` });
                    }
                }
            );

            if (allErrors.length > 0) {
                vscode.window.showErrorMessage(
                    `Some images failed to process:\n${allErrors.join('\n')}`
                );
            } else {
                vscode.window.showInformationMessage(
                    'Responsive images generated successfully!'
                );
            }
        } catch (err: any) {
            vscode.window.showErrorMessage(`Error: ${err.message}`);
            console.error(err);
        }
    }
);

/**
 * Command: Fill responsive image tag
 */
export const fillResponsiveTagCommand = vscode.commands.registerCommand(
    'responsive-image-generator.fillResponsiveTag',
    async (
        document: vscode.TextDocument,
        triggerStart: vscode.Position
    ): Promise<void> => {
        const result = await promptForAllInputs(null);
        if (!result) return;

        const { imageUris, outputDir, sizesToGenerate } = result;
        let srcsetParts: string[] = [];
        let allErrors: string[] = [];

        for (const imageUri of imageUris) {
            const itemName = path.basename(
                imageUri.fsPath,
                path.extname(imageUri.fsPath)
            );
            for (const size of sizesToGenerate) {
                const outputFile = getOutputFileName(imageUri.fsPath, outputDir, itemName, size);
                try {
                    await sharp(imageUri.fsPath)
                        .resize(size)
                        .toFile(outputFile);

                    // Use relative paths if configured
                    if (config.get('useRelativePaths')) {
                        const rootValue = config.get<string>('staticAssetsRoot');
                        const root =
                            typeof rootValue === 'string' && rootValue.length > 0
                                ? rootValue
                                : vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
                        const relativeOutputFile =
                            typeof root === 'string' && root.length > 0
                                ? `./${path.relative(root, outputFile)}`
                                : outputFile;
                        srcsetParts.push(`${relativeOutputFile} ${size}w`);
                    } else {
                        srcsetParts.push(`${outputFile} ${size}w`);
                    }
                } catch (err: any) {
                    allErrors.push(
                        `File: ${imageUri.fsPath}, Size: ${size}px, Error: ${err.message}`
                    );
                }
            }
        }

        const srcset = srcsetParts.join(', ');
        const sizes =
            sizesToGenerate
                .map((size: number) => `(max-width: ${size}px) ${size}px`)
                .join(', ') + ', 100vw';

        // Insert finished snippet, replacing the prefix
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const snippet = new vscode.SnippetString(
                `<img src="${srcsetParts[0]?.split(' ')[0] || ''}" srcset="${srcset}" sizes="${sizes}" alt="$1">`
            );
            const endPosition = triggerStart.translate(
                0,
                document.lineAt(triggerStart).text.length - triggerStart.character
            );
            await editor.edit((editBuilder) => {
                editBuilder.delete(new vscode.Range(triggerStart, endPosition));
            });
            editor.insertSnippet(snippet, triggerStart);
        }

        if (allErrors.length > 0) {
            vscode.window.showErrorMessage(
                `Some images failed to process:\n${allErrors.join('\n')}`
            );
        } else {
            vscode.window.showInformationMessage(
                'Added responsive image tag and generated images!'
            );
        }
    }
);
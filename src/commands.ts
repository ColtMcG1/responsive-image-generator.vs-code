import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { promptForAllInputs } from './prompts';
import { processImage } from './images';
import { config } from './extension';

export const disposable = vscode.commands.registerCommand('responsive-image-generator.generate', async function () {
		try {
			const result = await promptForAllInputs();
			if (!result) return;
			const { imageUris, outputDir, sizesToGenerate } = result;

			// Show progress while processing images
			await vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: 'Generating responsive images...',
				cancellable: false
			}, async (progress) => {
				progress.report({ message: 'Processing images...' });
				// Process all images and sizes in parallel
				await Promise.all(
					imageUris.map(imageUri => {
						const itemName = path.basename(imageUri.fsPath, path.extname(imageUri.fsPath));
						return processImage(imageUri.fsPath, outputDir, itemName, sizesToGenerate);
					})
				);
			});

			vscode.window.showInformationMessage('Responsive images generated successfully!');
		} catch (err: any) {
			vscode.window.showErrorMessage(`Error: ${err.message}`);
			console.error(err);
		}
	});

export const fillResponsiveTagCommand = vscode.commands.registerCommand('responsive-image-generator.fillResponsiveTag', async (document: vscode.TextDocument, triggerStart: vscode.Position) => {
    const result = await promptForAllInputs();
    if (!result) return;
    const { imageUris, outputDir, sizesToGenerate } = result;

    // Generate srcset string
    let srcsetParts: string[] = [];
    for (const imageUri of imageUris) {
        const itemName = path.basename(imageUri.fsPath, path.extname(imageUri.fsPath));
        for (const size of sizesToGenerate) {
            const outputFile = path.join(outputDir, `${itemName}_${size}${path.extname(imageUri.fsPath)}`);
            try {
                // Resize and save image
                await sharp(imageUri.fsPath)
                    .resize(size)
                    .toFile(outputFile);
                // Use relative paths if configured
                if (config.get('useRelativePaths')) {
                    const rootValue = config.get<string>('staticAssetsRoot');
                    const root = (typeof rootValue === 'string' && rootValue.length > 0)
                        ? rootValue
                        : vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
                    const relativeOutputFile = (typeof root === 'string' && root.length > 0)
                        ? `./${path.relative(root, outputFile)}`
                        : outputFile;
                    srcsetParts.push(`${relativeOutputFile} ${size}w`);
                } else {
                    srcsetParts.push(`${outputFile} ${size}w`);
                }
            } catch (err: any) {
                vscode.window.showErrorMessage(`Error processing ${imageUri.fsPath} for size ${size}: ${err.message}`);
            }
        }
    }
    const srcset = srcsetParts.join(', ');

    // Generate sizes attribute
    const sizes = sizesToGenerate.map((size: number) => `(max-width: ${size}px) ${size}px`).join(', ') + ', 100vw';

    // Insert finished snippet, replacing the prefix
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const snippet = new vscode.SnippetString(`<img src="${srcsetParts[0]?.split(' ')[0] || ''}" srcset="${srcset}" sizes="${sizes}" alt="$1">`);
        const endPosition = triggerStart.translate(0, document.lineAt(triggerStart).text.length - triggerStart.character);
        editor.edit(editBuilder => {
            editBuilder.delete(new vscode.Range(triggerStart, endPosition));
        }).then(() => {
            editor.insertSnippet(snippet, triggerStart);
        });
    }
    vscode.window.showInformationMessage('Add responsive image tag and generated images!');
})
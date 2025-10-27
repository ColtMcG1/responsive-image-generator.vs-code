import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import sharp from 'sharp';

export interface ProcessImageResult {
    successes: string[];
    errors: { size: number; error: string }[];
}

/**
 * Processes an image: resizes and saves to output directory with item name and size.
 * Returns a summary of successes and errors.
 */
export async function processImage(
    imagePath: string,
    outputDir: string,
    itemName: string,
    sizesToGenerate: number[]
): Promise<ProcessImageResult> {
    const result: ProcessImageResult = { successes: [], errors: [] };

    if (!fs.existsSync(imagePath)) {
        const msg = `Input file does not exist: ${imagePath}`;
        vscode.window.showErrorMessage(msg);
        result.errors.push({ size: 0, error: msg });
        return result;
    }

    await Promise.all(
        sizesToGenerate.map(async (size: number) => {
            const outputFile = path.join(
                outputDir,
                `${itemName}_${size}${path.extname(imagePath)}`
            );
            try {
                await sharp(imagePath)
                    .resize(size)
                    .toFile(outputFile);
                console.log(`Generated ${outputFile}`);
                result.successes.push(outputFile);
            } catch (err: unknown) {
                const error = err instanceof Error ? err : new Error(String(err));
                const errorMsg = `Error processing ${imagePath} for size ${size}: ${error.message}`;
                console.error(errorMsg);
                result.errors.push({ size, error: errorMsg });
            }
        })
    );

    // Show a summary message if there were errors
    if (result.errors.length > 0) {
        vscode.window.showErrorMessage(
            `Some images failed to process: ${result.errors.map(e => `${e.size}px`).join(', ')}`
        );
    }

    return result;
}
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import sharp from 'sharp';

/**
 * Processes an image: resizes and saves to output directory with item name and size.
 */
export async function processImage(
	imagePath: string,
	outputDir: string,
	itemName: string,
	sizesToGenerate: number[]
): Promise<void> {
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
			} catch (err: any) {
				vscode.window.showErrorMessage(`Error processing ${imagePath} for size ${size}: ${err.message}`);
			}
		})
	);
}
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const config = vscode.workspace.getConfiguration('responsiveImageGenerator');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */


/**
 * Activates the Responsive Image Generator extension.
 * Registers commands and completion providers.
 * @param {vscode.ExtensionContext} context - The extension context provided by VS Code.
 */
function activate(context) {
	const extensionPackageJson = require(path.join(context.extensionPath, 'package.json'));

	// Register the main command for generating responsive images
	const disposable = vscode.commands.registerCommand('responsive-image-generator.generate', async function () {
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
		} catch (err) {
			vscode.window.showErrorMessage(`Error: ${err.message}`);
			console.error(err);
		}
	});
	context.subscriptions.push(disposable);

	// Supported languages for completion provider
	// Dynamically fetch supported languages from package.json activationEvents
	let supportedLanguages = [];
	if (extensionPackageJson.activationEvents) {
		supportedLanguages = extensionPackageJson.activationEvents
			.filter(event => event.startsWith('onLanguage:'))
			.map(event => event.replace('onLanguage:', ''));
	}

	const searchWord = 'responsive';
	const triggerCharacters = ['<', '>', '!'];

	// Register completion provider for responsive image tag
	const provider = vscode.languages.registerCompletionItemProvider(
		supportedLanguages,
		{
			/**
			 * Provides completion items for responsive image tag.
			 * @param {vscode.TextDocument} document
			 * @param {vscode.Position} position
			 * @returns {vscode.CompletionItem[]|undefined}
			 */
			provideCompletionItems(document, position) {
				const linePrefix = document.lineAt(position).text.split(new RegExp(`[${triggerCharacters.join('')}]`)).at(1)?.trim() || '';
				if (searchWord.includes(linePrefix) && linePrefix.length > 0) {
					const completion = new vscode.CompletionItem('responsive_image_basic', vscode.CompletionItemKind.Snippet);
					completion.command = {
						command: 'responsive-image-generator.fillResponsiveTag',
						title: 'Fill Responsive Image Tag',
						arguments: [document, position.translate(0, -(linePrefix.length + 1))]
					};
					return [completion];
				}
				return undefined;
			}
		},
		...triggerCharacters
	);
	context.subscriptions.push(provider);

	// Register command to fill responsive tag after completion is selected
	context.subscriptions.push(vscode.commands.registerCommand('responsive-image-generator.fillResponsiveTag', async (document, triggerStart) => {
		const result = await promptForAllInputs();
		if (!result) return;
		const { imageUris, outputDir, sizesToGenerate } = result;

		// Generate srcset string
		let srcsetParts = [];
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
					if(config.get('useRelativePaths')) {
						const root = config.get('staticAssetsRoot') || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
						const relativeOutputFile = root ? `./${path.relative(root, outputFile)}` : outputFile;
						srcsetParts.push(`${relativeOutputFile} ${size}w`);
					} else {
						srcsetParts.push(`${outputFile} ${size}w`);
					}
				} catch (err) {
					vscode.window.showErrorMessage(`Error processing ${imageUri.fsPath} for size ${size}: ${err.message}`);
				}
			}
		}
		const srcset = srcsetParts.join(', ');

		// Generate sizes attribute
		const sizes = sizesToGenerate.map(size => `(max-width: ${size}px) ${size}px`).join(', ') + ', 100vw';

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
	}));
}




/**
 * Prompts the user for all required inputs: image files, output directory, and sizes.
 * Handles duplicate logic and error messaging for missing selections.
 * @returns {Promise<{imageUris: vscode.Uri[], outputDir: string, sizesToGenerate: number[]} | undefined>} Object with all inputs, or undefined if cancelled.
 */
async function promptForAllInputs() {
	// Prompt for image file(s)
	const imageUris = await promptForImageFiles();
	if (!imageUris || imageUris.length === 0) {
		vscode.window.showWarningMessage('No image selected. Operation cancelled.');
		return undefined;
	}

	// Prompt for output directory
	const outputDir = await promptForOutputDirectory();
	if (!outputDir) {
		vscode.window.showWarningMessage('No output directory selected. Operation cancelled.');
		return undefined;
	}

	// Prompt for sizes
	const sizesToGenerate = await promptForSizes();
	if (!sizesToGenerate || sizesToGenerate.length === 0) {
		vscode.window.showWarningMessage('No sizes selected. Operation cancelled.');
		return undefined;
	}

	// Create output directory if it doesn't exist
	if (!fs.existsSync(outputDir)) {
		fs.mkdirSync(outputDir, { recursive: true });
	}

	return { imageUris, outputDir, sizesToGenerate };
}

/**
 * Prompts the user to select image files.
 * @returns {Promise<vscode.Uri[]|undefined>} Array of selected image URIs or undefined if cancelled.
 */
async function promptForImageFiles() {
	return await vscode.window.showOpenDialog({
		canSelectMany: true,
		openLabel: 'Select Image(s)',
		filters: {
			'Images': ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg']
		}
	});
}

/**
 * Prompts the user to select an output directory, preferring 'wwwroot' or 'public' if available.
 * @returns {Promise<string|undefined>} Path to selected output directory or undefined if cancelled.
 */
async function promptForOutputDirectory() {
	const workspaceFolders = vscode.workspace.workspaceFolders || [];
	let staticContentFolder = workspaceFolders.find(folder => (folder.name.toLowerCase() === 'wwwroot') || (folder.name.toLowerCase() === 'public'));
	let preselectUri = staticContentFolder ? staticContentFolder.uri : undefined;

	const folder = await vscode.window.showWorkspaceFolderPick({
		placeHolder: "Select output folder ('wwwroot' or 'public' will be preselected if available)",
	});
	if (folder) {
		return folder.uri.fsPath;
	} else if (preselectUri) {
		return preselectUri.fsPath;
	} else {
		return undefined;
	}
}

/**
 * Prompts the user to select image sizes to generate.
 * @returns {Promise<number[]|undefined>} Array of selected sizes or undefined if cancelled.
 */
async function promptForSizes() {
	const sizes = config.get('defaultSizes') || [320, 480, 768, 1024, 1280, 1600, 1920, 2560, 3840, 5120, 7680];
	const selectedSizes = await vscode.window.showQuickPick(sizes.map(size => size.toString()), {
		placeHolder: 'Select sizes to generate (you can select multiple)',
		canPickMany: true
	});
	return selectedSizes ? selectedSizes.map(size => parseInt(size)) : undefined;
}


/**
 * Processes an image: resizes and saves to output directory with item name and size.
 * @param {string} imagePath - Path to the source image file.
 * @param {string} outputDir - Directory to save resized images.
 * @param {string} itemName - Base name for output files.
 * @param {number[]} sizesToGenerate - Array of sizes to generate.
 * @returns {Promise<void>}
 */
async function processImage(imagePath, outputDir, itemName, sizesToGenerate) {
	await Promise.all(
		sizesToGenerate.map(async (size) => {
			const outputFile = path.join(
				outputDir,
				`${itemName}_${size}${path.extname(imagePath)}`
			);
			try {
				await sharp(imagePath)
					.resize(size)
					.toFile(outputFile);
				console.log(`Generated ${outputFile}`);
			} catch (err) {
				vscode.window.showErrorMessage(`Error processing ${imagePath} for size ${size}: ${err.message}`);
			}
		})
	);
}

// This method is called when your extension is deactivated


/**
 * Deactivates the extension.
 * Called when the extension is deactivated.
 */
function deactivate() { }

module.exports = {
	activate,
	deactivate
}
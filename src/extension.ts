// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as commands from './commands';
import * as provider from './provider';
import * as path from 'path';

export const config = vscode.workspace.getConfiguration('responsiveImageGenerator');

/**
 * Activates the Responsive Image Generator extension.
 * Registers commands and completion providers.
 */
export function activate(context: vscode.ExtensionContext) {
	// Use dynamic import for package.json
	// @ts-ignore
	const extensionPackageJson = require(path.join(context.extensionPath, 'package.json'));

	// Register the main command for generating responsive images
	context.subscriptions.push(commands.disposable);

	// Register command to fill responsive tag after completion is selected
	context.subscriptions.push(commands.fillResponsiveTagCommand);

	context.subscriptions.push(provider.provider);
}




/**
 * Deactivates the extension.
 * Called when the extension is deactivated.
 */
export function deactivate() {}
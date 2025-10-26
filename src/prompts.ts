import * as vscode from 'vscode';
import * as fs from 'fs';
import { config } from './extension';

/**
 * Prompts the user for all required inputs: image files, output directory, and sizes.
 * Handles duplicate logic and error messaging for missing selections.
 */
export async function promptForAllInputs(imageUris: vscode.Uri[] | undefined | null): Promise<{ imageUris: vscode.Uri[]; outputDir: string; sizesToGenerate: number[] } | undefined> {
    // If imageUris not provided, prompt user to select image files
    if (!imageUris || imageUris === null) {
        imageUris = await promptForImageFiles();
    }

    // Handle case where no images were selected
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

    // Prompt for sizes to generate
    const sizesToGenerate = await promptForSizes();
    if (!sizesToGenerate || sizesToGenerate.length === 0) {
        vscode.window.showWarningMessage('No sizes selected. Operation cancelled.');
        return undefined;
    }

    // Ensure output directory exists
    try {
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
    } catch (err: any) {
        vscode.window.showErrorMessage(`Failed to create output directory: ${err.message}`);
        return undefined;
    }

    // Return all collected inputs
    return { imageUris, outputDir, sizesToGenerate };
}

/**
 * Prompts the user to select image files.
 */
export async function promptForImageFiles(): Promise<vscode.Uri[] | undefined> {
    return vscode.window.showOpenDialog({
        canSelectMany: true,
        openLabel: 'Select Image(s)',
        filters: {
            Images: ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg'],
        },
    });
}

/**
 * Prompts the user to select an output directory, preferring 'wwwroot' or 'public' if available.
 */
export async function promptForOutputDirectory(): Promise<string | undefined> {
    const workspaceFolders = vscode.workspace.workspaceFolders || [];
    const staticContentFolder = workspaceFolders.find(
        (folder) => folder.name.toLowerCase() === 'wwwroot' || folder.name.toLowerCase() === 'public'
    );

    const folder = await vscode.window.showWorkspaceFolderPick({
        placeHolder: "Select output folder ('wwwroot' or 'public' will be preselected if available)",
    });

    if (folder) {
        return folder.uri.fsPath;
    } else if (staticContentFolder) {
        return staticContentFolder.uri.fsPath;
    } else {
        return undefined;
    }
}

/**
 * Prompts the user to select image sizes to generate.
 */
export async function promptForSizes(): Promise<number[] | undefined> {
    const sizesConfig = config.get<number[]>('defaultSizes');
    const sizes = Array.isArray(sizesConfig)
        ? sizesConfig
        : [320, 480, 768, 1024, 1280, 1600, 1920, 2560, 3840, 5120, 7680];

    const selectedSizes = await vscode.window.showQuickPick(
        sizes.map((size: number) => size.toString()),
        {
            placeHolder: 'Select sizes to generate (you can select multiple)',
            canPickMany: true,
        }
    );
    return selectedSizes ? selectedSizes.map((size: string) => parseInt(size, 10)) : undefined;
}
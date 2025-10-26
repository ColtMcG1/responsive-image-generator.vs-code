"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.promptForAllInputs = promptForAllInputs;
exports.promptForImageFiles = promptForImageFiles;
exports.promptForOutputDirectory = promptForOutputDirectory;
exports.promptForSizes = promptForSizes;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const extension_1 = require("./extension");
/**
 * Prompts the user for all required inputs: image files, output directory, and sizes.
 * Handles duplicate logic and error messaging for missing selections.
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
    }
    else if (preselectUri) {
        return preselectUri.fsPath;
    }
    else {
        return undefined;
    }
}
/**
 * Prompts the user to select image sizes to generate.
 */
async function promptForSizes() {
    const sizesConfig = extension_1.config.get('defaultSizes');
    const sizes = Array.isArray(sizesConfig) ? sizesConfig : [320, 480, 768, 1024, 1280, 1600, 1920, 2560, 3840, 5120, 7680];
    const selectedSizes = await vscode.window.showQuickPick(sizes.map((size) => size.toString()), {
        placeHolder: 'Select sizes to generate (you can select multiple)',
        canPickMany: true
    });
    return selectedSizes ? selectedSizes.map((size) => parseInt(size)) : undefined;
}

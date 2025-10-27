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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fillResponsiveTagCommand = exports.disposable = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const sharp_1 = __importDefault(require("sharp"));
const prompts_1 = require("./prompts");
const images_1 = require("./images");
const extension_1 = require("./extension");
/**
 * Helper to generate output file name.
 */
function getOutputFileName(imagePath, outputDir, itemName, size) {
    return path.join(outputDir, `${itemName}_${size}${path.extname(imagePath)}`);
}
/**
 * Command: Generate responsive images
 */
exports.disposable = vscode.commands.registerCommand('responsive-image-generator.generate', async (resourceUri) => {
    try {
        const result = await (0, prompts_1.promptForAllInputs)(resourceUri ? [resourceUri] : undefined);
        if (!result)
            return;
        const { imageUris, outputDir, sizesToGenerate } = result;
        let allErrors = [];
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Generating responsive images...',
            cancellable: false,
        }, async (progress) => {
            let completed = 0;
            const total = imageUris.length;
            for (const imageUri of imageUris) {
                const itemName = path.basename(imageUri.fsPath, path.extname(imageUri.fsPath));
                const imageResult = await (0, images_1.processImage)(imageUri.fsPath, outputDir, itemName, sizesToGenerate);
                if (imageResult.errors.length > 0) {
                    allErrors.push(...imageResult.errors.map(e => `File: ${imageUri.fsPath}, Size: ${e.size}px, Error: ${e.error}`));
                }
                completed++;
                progress.report({ message: `Processed ${completed} of ${total}` });
            }
        });
        if (allErrors.length > 0) {
            vscode.window.showErrorMessage(`Some images failed to process:\n${allErrors.join('\n')}`);
        }
        else {
            vscode.window.showInformationMessage('Responsive images generated successfully!');
        }
    }
    catch (err) {
        vscode.window.showErrorMessage(`Error: ${err.message}`);
        console.error(err);
    }
});
/**
 * Command: Fill responsive image tag
 */
exports.fillResponsiveTagCommand = vscode.commands.registerCommand('responsive-image-generator.fillResponsiveTag', async (document, triggerStart) => {
    const result = await (0, prompts_1.promptForAllInputs)(null);
    if (!result)
        return;
    const { imageUris, outputDir, sizesToGenerate } = result;
    let srcsetParts = [];
    let allErrors = [];
    for (const imageUri of imageUris) {
        const itemName = path.basename(imageUri.fsPath, path.extname(imageUri.fsPath));
        for (const size of sizesToGenerate) {
            const outputFile = getOutputFileName(imageUri.fsPath, outputDir, itemName, size);
            try {
                await (0, sharp_1.default)(imageUri.fsPath)
                    .resize(size)
                    .toFile(outputFile);
                // Use relative paths if configured
                if (extension_1.config.get('useRelativePaths')) {
                    const rootValue = extension_1.config.get('staticAssetsRoot');
                    const root = typeof rootValue === 'string' && rootValue.length > 0
                        ? rootValue
                        : vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
                    const relativeOutputFile = typeof root === 'string' && root.length > 0
                        ? `./${path.relative(root, outputFile)}`
                        : outputFile;
                    srcsetParts.push(`${relativeOutputFile} ${size}w`);
                }
                else {
                    srcsetParts.push(`${outputFile} ${size}w`);
                }
            }
            catch (err) {
                allErrors.push(`File: ${imageUri.fsPath}, Size: ${size}px, Error: ${err.message}`);
            }
        }
    }
    const srcset = srcsetParts.join(', ');
    const sizes = sizesToGenerate
        .map((size) => `(max-width: ${size}px) ${size}px`)
        .join(', ') + ', 100vw';
    // Insert finished snippet, replacing the prefix
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const snippet = new vscode.SnippetString(`<img src="${srcsetParts[0]?.split(' ')[0] || ''}" srcset="${srcset}" sizes="${sizes}" alt="$1">`);
        const endPosition = triggerStart.translate(0, document.lineAt(triggerStart).text.length - triggerStart.character);
        await editor.edit((editBuilder) => {
            editBuilder.delete(new vscode.Range(triggerStart, endPosition));
        });
        editor.insertSnippet(snippet, triggerStart);
    }
    if (allErrors.length > 0) {
        vscode.window.showErrorMessage(`Some images failed to process:\n${allErrors.join('\n')}`);
    }
    else {
        vscode.window.showInformationMessage('Added responsive image tag and generated images!');
    }
});

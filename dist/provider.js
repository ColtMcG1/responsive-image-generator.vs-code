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
exports.provider = void 0;
const vscode = __importStar(require("vscode"));
// Use dynamic import for package.json
// @ts-ignore
const extensionPackageJson = __importStar(require("../package.json"));
// Supported languages for completion provider
// Dynamically fetch supported languages from package.json activationEvents
let supportedLanguages = [];
if (extensionPackageJson.activationEvents) {
    supportedLanguages = extensionPackageJson.activationEvents
        .filter((event) => event.startsWith('onLanguage:'))
        .map((event) => event.replace('onLanguage:', ''));
}
const searchWord = 'responsive';
const triggerCharacters = ['<', '>', '!'];
// Register completion provider for responsive image tag
exports.provider = vscode.languages.registerCompletionItemProvider(supportedLanguages, {
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
}, ...triggerCharacters);

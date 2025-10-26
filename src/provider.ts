import * as vscode from 'vscode';
import * as path from 'path';
// Use dynamic import for package.json
// @ts-ignore
import * as extensionPackageJson from '../package.json';

// Supported languages for completion provider
// Dynamically fetch supported languages from package.json activationEvents
let supportedLanguages: string[] = [];
if (extensionPackageJson.activationEvents) {
    supportedLanguages = extensionPackageJson.activationEvents
        .filter((event: string) => event.startsWith('onLanguage:'))
        .map((event: string) => event.replace('onLanguage:', ''));
}

const searchWord = 'responsive';
const triggerCharacters = ['<', '>', '!'];

// Register completion provider for responsive image tag
export const provider = vscode.languages.registerCompletionItemProvider(
    supportedLanguages,
    {
        provideCompletionItems(
            document: vscode.TextDocument,
            position: vscode.Position
        ): vscode.CompletionItem[] | undefined {
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
import * as vscode from 'vscode';
import * as path from 'path';

// Import package.json for activationEvents
// @ts-ignore
import extensionPackageJson from '../package.json';

// Constants
const searchWord = 'responsive';
const triggerCharacters = ['<', '>', '!'];

// Dynamically fetch supported languages from package.json activationEvents
const supportedLanguages: string[] = extensionPackageJson.activationEvents
    ? extensionPackageJson.activationEvents
        .filter((event: string) => event.startsWith('onLanguage:'))
        .map((event: string) => event.replace('onLanguage:', ''))
    : [];

/**
 * Completion provider for responsive image tag.
 */
export const provider = vscode.languages.registerCompletionItemProvider(
    supportedLanguages,
    {
        provideCompletionItems(
            document: vscode.TextDocument,
            position: vscode.Position
        ): vscode.CompletionItem[] | undefined {
            // Extract the word before the cursor that may trigger completion
            const line = document.lineAt(position).text;
            const prefixMatch = line.slice(0, position.character).match(/(\w+)$/);
            const linePrefix = prefixMatch ? prefixMatch[1] : '';

            if (searchWord.includes(linePrefix) && linePrefix.length > 0) {
                const completion = new vscode.CompletionItem(
                    'responsive_image_basic',
                    vscode.CompletionItemKind.Snippet
                );
                completion.command = {
                    command: 'responsive-image-generator.fillResponsiveTag',
                    title: 'Fill Responsive Image Tag',
                    arguments: [document, position.translate(0, -(linePrefix.length))]
                };
                return [completion];
            }
            return undefined;
        }
    },
    ...triggerCharacters
);
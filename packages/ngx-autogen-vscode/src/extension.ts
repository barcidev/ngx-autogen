import * as vscode from 'vscode';
import { generateStoreCommand } from './commands/generate-store';
import { generateI18nCommand } from './commands/generate-i18n';
import { generateComponentCommand } from './commands/generate-component';

export function activate(context: vscode.ExtensionContext) {
  const storeDisposable = vscode.commands.registerCommand('ngx-autogen.generateStore', (uri) => generateStoreCommand(uri, false));
  const i18nDisposable = vscode.commands.registerCommand('ngx-autogen.generateI18n', (uri) => generateI18nCommand(uri, false));
  const componentDisposable = vscode.commands.registerCommand('ngx-autogen.generateComponent', (uri) => generateComponentCommand(uri, false));

  const storeInteractiveDisposable = vscode.commands.registerCommand('ngx-autogen.generateStoreInteractive', (uri) => generateStoreCommand(uri, true));
  const i18nInteractiveDisposable = vscode.commands.registerCommand('ngx-autogen.generateI18nInteractive', (uri) => generateI18nCommand(uri, true));
  const componentInteractiveDisposable = vscode.commands.registerCommand('ngx-autogen.generateComponentInteractive', (uri) => generateComponentCommand(uri, true));

  context.subscriptions.push(
    storeDisposable, i18nDisposable, componentDisposable,
    storeInteractiveDisposable, i18nInteractiveDisposable, componentInteractiveDisposable
  );
}

export function deactivate() {}

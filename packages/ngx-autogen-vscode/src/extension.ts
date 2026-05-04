import * as vscode from 'vscode';
import { generateStoreCommand } from './commands/generate-store';
import { generateI18nCommand } from './commands/generate-i18n';
import { generateComponentCommand } from './commands/generate-component';

export function activate(context: vscode.ExtensionContext) {
  const storeDisposable = vscode.commands.registerCommand('ngx-autogen.generateStore', generateStoreCommand);
  const i18nDisposable = vscode.commands.registerCommand('ngx-autogen.generateI18n', generateI18nCommand);
  const componentDisposable = vscode.commands.registerCommand('ngx-autogen.generateComponent', generateComponentCommand);

  context.subscriptions.push(storeDisposable, i18nDisposable, componentDisposable);
}

export function deactivate() {}

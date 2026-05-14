import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { generateStoreCommand } from './commands/generate-store';
import { generateI18nCommand } from './commands/generate-i18n';
import { generateComponentCommand } from './commands/generate-component';

export function activate(context: vscode.ExtensionContext) {
  const storeDisposable = vscode.commands.registerCommand('ngx-autogen.generateStore', (uri) => generateStoreCommand(uri, false));
  const i18nDisposable = vscode.commands.registerCommand('ngx-autogen.generateI18n', (uri) => generateI18nCommand(uri, false));
  const componentDisposable = vscode.commands.registerCommand('ngx-autogen.generateComponent', (uri) => generateComponentCommand(uri, false));

  const storeInteractiveDisposable = vscode.commands.registerCommand('ngx-autogen.generateStoreInteractive', (uri) => generateStoreCommand(uri, true));
  const componentInteractiveDisposable = vscode.commands.registerCommand('ngx-autogen.generateComponentInteractive', (uri) => generateComponentCommand(uri, true));

  context.subscriptions.push(
    storeDisposable, i18nDisposable, componentDisposable,
    storeInteractiveDisposable, componentInteractiveDisposable
  );

  const updateConfigContext = () => {
    let hasConfig = false;
    const folders = vscode.workspace.workspaceFolders;
    if (folders) {
      for (const folder of folders) {
        if (fs.existsSync(path.join(folder.uri.fsPath, '.autogen', 'config.json'))) {
          hasConfig = true;
          break;
        }
      }
    }
    vscode.commands.executeCommand('setContext', 'ngx-autogen:hasConfig', hasConfig);
  };

  updateConfigContext();

  const watcher = vscode.workspace.createFileSystemWatcher('**/.autogen/config.json');
  watcher.onDidCreate(updateConfigContext);
  watcher.onDidChange(updateConfigContext);
  watcher.onDidDelete(updateConfigContext);
  context.subscriptions.push(watcher);
}

export function deactivate() {}

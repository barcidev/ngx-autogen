import * as vscode from 'vscode';
import { generateStore, StoreOptions } from '../generators/store.generator';
import { getConfig, promptToSaveConfig } from '../utils/config.utils';

export async function generateStoreCommand(uri: vscode.Uri, interactive: boolean = false) {
  if (!uri || !uri.fsPath) {
    vscode.window.showErrorMessage('No folder selected');
    return;
  }

  const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri)?.uri.fsPath || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  const config = (!interactive && workspaceFolder) ? getConfig(workspaceFolder) : null;

  const entityName = await vscode.window.showInputBox({
    prompt: 'Entity name (e.g. product, invoice):',
    validateInput: text => text ? null : 'Entity name is required'
  });
  if (!entityName) return;

  let useGroupedLayout = config?.store?.useGroupedLayout;
  if (useGroupedLayout === undefined) {
    const groupedLayoutSelection = await vscode.window.showQuickPick(['No', 'Yes'], {
      placeHolder: 'Use grouped layout? (models/ and services/ subfolders)'
    });
    if (!groupedLayoutSelection) return;
    useGroupedLayout = groupedLayoutSelection === 'Yes';
  }

  let primaryKey = config?.store?.primaryKey;
  if (!primaryKey) {
    primaryKey = await vscode.window.showInputBox({
      prompt: 'Primary key field name:',
      value: 'id'
    });
    if (!primaryKey) return;
  }

  let provideInRoot = config?.store?.provideInRoot;
  if (provideInRoot === undefined) {
    const provideInRootSelection = await vscode.window.showQuickPick(['No', 'Yes'], {
      placeHolder: "Provide in root? (providedIn: 'root')"
    });
    if (!provideInRootSelection) return;
    provideInRoot = provideInRootSelection === 'Yes';
  }

  let defaultLang = config?.defaultLang;
  if (!defaultLang) {
    const defaultLangSelection = await vscode.window.showQuickPick(['en', 'es'], {
      placeHolder: 'Default language for pluralization:'
    });
    if (!defaultLangSelection) return;
    defaultLang = defaultLangSelection as 'en' | 'es';
  }

  const options: StoreOptions = {
    entityName,
    useGroupedLayout,
    primaryKey,
    provideInRoot,
    defaultLang
  };

  await generateStore(uri.fsPath, options);

  if (workspaceFolder) {
    await promptToSaveConfig(workspaceFolder, {
      defaultLang,
      store: {
        primaryKey,
        provideInRoot,
        useGroupedLayout
      }
    }, interactive);
  }
}

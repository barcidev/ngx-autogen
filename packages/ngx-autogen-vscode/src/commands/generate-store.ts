import * as vscode from 'vscode';
import { generateStore, StoreOptions } from '../generators/store.generator';

export async function generateStoreCommand(uri: vscode.Uri) {
  if (!uri || !uri.fsPath) {
    vscode.window.showErrorMessage('No folder selected');
    return;
  }

  const entityName = await vscode.window.showInputBox({
    prompt: 'Entity name (e.g. product, invoice):',
    validateInput: text => text ? null : 'Entity name is required'
  });
  if (!entityName) return;

  const groupedLayoutSelection = await vscode.window.showQuickPick(['No', 'Yes'], {
    placeHolder: 'Use grouped layout? (models/ and services/ subfolders)'
  });
  if (!groupedLayoutSelection) return;
  const useGroupedLayout = groupedLayoutSelection === 'Yes';

  const primaryKey = await vscode.window.showInputBox({
    prompt: 'Primary key field name:',
    value: 'id'
  });
  if (!primaryKey) return;

  const provideInRootSelection = await vscode.window.showQuickPick(['No', 'Yes'], {
    placeHolder: "Provide in root? (providedIn: 'root')"
  });
  if (!provideInRootSelection) return;
  const provideInRoot = provideInRootSelection === 'Yes';

  const defaultLangSelection = await vscode.window.showQuickPick(['en', 'es'], {
    placeHolder: 'Default language for pluralization:'
  });
  if (!defaultLangSelection) return;
  const defaultLang = defaultLangSelection as 'en' | 'es';

  const options: StoreOptions = {
    entityName,
    useGroupedLayout,
    primaryKey,
    provideInRoot,
    defaultLang
  };

  await generateStore(uri.fsPath, options);
}

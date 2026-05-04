import * as vscode from 'vscode';
import { generateComponent, ComponentOptions } from '../generators/component.generator';
import { StoreOptions } from '../generators/store.generator';
import { I18nOptions } from '../generators/i18n.generator';

export async function generateComponentCommand(uri: vscode.Uri) {
  if (!uri || !uri.fsPath) {
    vscode.window.showErrorMessage('No folder selected');
    return;
  }

  const name = await vscode.window.showInputBox({
    prompt: 'Component name (e.g. product-list, user-profile):',
    validateInput: text => text ? null : 'Component name is required'
  });
  if (!name) return;

  const styleExtSelection = await vscode.window.showQuickPick(['css', 'scss', 'sass', 'less'], {
    placeHolder: 'Style extension:'
  });
  if (!styleExtSelection) return;
  const styleExt = styleExtSelection;

  const generateStoreSelection = await vscode.window.showQuickPick(['No', 'Yes'], {
    placeHolder: 'Generate NgRx Signal Store for this component?'
  });
  if (!generateStoreSelection) return;
  const shouldGenerateStore = generateStoreSelection === 'Yes';

  const generateI18nSelection = await vscode.window.showQuickPick(['No', 'Yes'], {
    placeHolder: 'Generate Transloco i18n scope?'
  });
  if (!generateI18nSelection) return;
  const shouldGenerateI18n = generateI18nSelection === 'Yes';

  const skipSpecSelection = await vscode.window.showQuickPick(['No', 'Yes'], {
    placeHolder: 'Skip spec file?'
  });
  if (!skipSpecSelection) return;
  const skipTests = skipSpecSelection === 'Yes';

  let storeOptions: StoreOptions | undefined;
  if (shouldGenerateStore) {
    const entityName = await vscode.window.showInputBox({
      prompt: 'Entity store name (default = component name):',
      value: name
    });
    if (!entityName) return;

    const primaryKey = await vscode.window.showInputBox({
      prompt: 'Primary key field name:',
      value: 'id'
    });
    if (!primaryKey) return;

    const provideInRootSelection = await vscode.window.showQuickPick(['No', 'Yes'], {
      placeHolder: 'Provide store in root?'
    });
    if (!provideInRootSelection) return;
    const provideInRoot = provideInRootSelection === 'Yes';

    const defaultLangSelection = await vscode.window.showQuickPick(['en', 'es'], {
      placeHolder: 'Default language for pluralization:'
    });
    if (!defaultLangSelection) return;
    const defaultLang = defaultLangSelection as 'en' | 'es';

    storeOptions = {
      entityName,
      useGroupedLayout: false, // For component local stores, default to non-grouped
      primaryKey,
      provideInRoot,
      defaultLang
    };
  }

  let i18nOptions: I18nOptions | undefined;
  if (shouldGenerateI18n) {
    const scopeName = await vscode.window.showInputBox({
      prompt: 'Scope name:',
      value: name
    });
    if (!scopeName) return;

    const defaultLangSelection = await vscode.window.showQuickPick(['en', 'es'], {
      placeHolder: 'Default language:'
    });
    if (!defaultLangSelection) return;
    const defaultLang = defaultLangSelection as 'en' | 'es';

    i18nOptions = {
      scopeName,
      defaultLang
    };
  }

  const options: ComponentOptions = {
    name,
    styleExt,
    skipTests,
    generateStore: shouldGenerateStore,
    storeOptions,
    generateI18n: shouldGenerateI18n,
    i18nOptions
  };

  await generateComponent(uri.fsPath, options);
}

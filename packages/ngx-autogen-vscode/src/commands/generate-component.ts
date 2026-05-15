import * as vscode from 'vscode';
import { ComponentOptions, generateComponent } from '../generators/component.generator';
import { I18nOptions } from '../generators/i18n.generator';
import { StoreOptions } from '../generators/store.generator';
import { getConfig, getDefaultLangFromProject, promptToSaveConfig } from '../utils/config.utils';

export async function generateComponentCommand(uri: vscode.Uri, interactive: boolean = false) {
  if (!uri || !uri.fsPath) {
    vscode.window.showErrorMessage('No folder selected');
    return;
  }

  const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri)?.uri.fsPath || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  const config = (!interactive && workspaceFolder) ? getConfig(workspaceFolder) : null;

  const name = await vscode.window.showInputBox({
    prompt: 'Component name (e.g. product-list, user-profile):',
    validateInput: text => text ? null : 'Component name is required'
  });
  if (!name) return;

  let styleExt = config?.styleExt;
  if (!styleExt) {
    styleExt = await vscode.window.showQuickPick(['css', 'scss', 'sass', 'less'], {
      placeHolder: 'Style extension:'
    });
    if (!styleExt) return;
  }

  let shouldGenerateStore = config?.component?.generateStore;
  if (shouldGenerateStore === undefined) {
    const generateStoreSelection = await vscode.window.showQuickPick(['Yes', 'No'], {
      placeHolder: 'Generate NgRx Signal Store for this component?'
    });
    if (!generateStoreSelection) return;
    shouldGenerateStore = generateStoreSelection === 'Yes';
  }

  let shouldGenerateI18n = config?.component?.generateI18n;
  if (shouldGenerateI18n === undefined) {
    const generateI18nSelection = await vscode.window.showQuickPick(['Yes', 'No'], {
      placeHolder: 'Generate Transloco i18n scope?'
    });
    if (!generateI18nSelection) return;
    shouldGenerateI18n = generateI18nSelection === 'Yes';
  }

  let skipTests = config?.skipTests;
  if (skipTests === undefined) {
    const skipSpecSelection = await vscode.window.showQuickPick(['No', 'Yes'], {
      placeHolder: 'Skip spec file?'
    });
    if (!skipSpecSelection) return;
    skipTests = skipSpecSelection === 'Yes';
  }

  let storeOptions: StoreOptions | undefined;
  if (shouldGenerateStore) {
    const entityName = await vscode.window.showInputBox({
      prompt: 'Entity store name (default = component name):',
      value: name
    });
    if (!entityName) return;

    let useGroupedLayout = config?.store?.useGroupedLayout;
    if (useGroupedLayout === undefined) {
      const groupedLayoutSelection = await vscode.window.showQuickPick(['No', 'Yes'], {
        placeHolder: 'Use grouped layout for store? (models/ and services/ subfolders)'
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
        placeHolder: 'Provide store in root?'
      });
      if (!provideInRootSelection) return;
      provideInRoot = provideInRootSelection === 'Yes';
    }

    let defaultLang: 'en' | 'es' | undefined = config?.store?.pluralizationLang;
    if (!defaultLang && workspaceFolder) {
      defaultLang = getDefaultLangFromProject(workspaceFolder) || undefined;
    }

    if (!defaultLang) {
      const defaultLangSelection = await vscode.window.showQuickPick(['en', 'es'], {
        placeHolder: 'Default language for pluralization:'
      });
      if (!defaultLangSelection) return;
      defaultLang = defaultLangSelection as 'en' | 'es';
    }

    storeOptions = {
      entityName,
      useGroupedLayout,
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

    let defaultLang: 'en' | 'es' | undefined;
    if (workspaceFolder) {
      defaultLang = getDefaultLangFromProject(workspaceFolder) || undefined;
    }

    if (!defaultLang) {
      const defaultLangSelection = await vscode.window.showQuickPick(['en', 'es'], {
        placeHolder: 'Default language:'
      });
      if (!defaultLangSelection) return;
      defaultLang = defaultLangSelection as 'en' | 'es';
    }

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

  if (workspaceFolder) {
    await promptToSaveConfig(workspaceFolder, {
      styleExt,
      skipTests,
      component: {
        generateStore: shouldGenerateStore,
        generateI18n: shouldGenerateI18n
      },
      store: shouldGenerateStore ? {
        primaryKey: storeOptions?.primaryKey,
        provideInRoot: storeOptions?.provideInRoot,
        useGroupedLayout: storeOptions?.useGroupedLayout,
        pluralizationLang: storeOptions?.defaultLang
      } : undefined
    }, interactive);
  }
}

import * as vscode from 'vscode';
import * as fs from 'fs';
import { generateI18n, I18nOptions } from '../generators/i18n.generator';
import { getConfig, getDefaultLangFromProject } from '../utils/config.utils';

export async function generateI18nCommand(uri: vscode.Uri, interactive: boolean = false) {
  if (!uri || !uri.fsPath) {
    vscode.window.showErrorMessage('No folder selected');
    return;
  }

  const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri)?.uri.fsPath || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  const config = (!interactive && workspaceFolder) ? getConfig(workspaceFolder) : null;

  let defaultScopeName = '';
  const files = fs.readdirSync(uri.fsPath);
  const componentFile = files.find(f => f.endsWith('.component.ts'));
  if (componentFile) {
    defaultScopeName = componentFile.replace('.component.ts', '');
  }

  const scopeName = await vscode.window.showInputBox({
    prompt: 'Scope name (e.g. dashboard, settings):',
    value: defaultScopeName,
    validateInput: text => text ? null : 'Scope name is required'
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

  const options: I18nOptions = {
    scopeName,
    defaultLang
  };

  await generateI18n(uri.fsPath, options);
}

import * as vscode from 'vscode';
import * as fs from 'fs';
import { generateI18n, I18nOptions } from '../generators/i18n.generator';

export async function generateI18nCommand(uri: vscode.Uri) {
  if (!uri || !uri.fsPath) {
    vscode.window.showErrorMessage('No folder selected');
    return;
  }

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

  const defaultLangSelection = await vscode.window.showQuickPick(['en', 'es'], {
    placeHolder: 'Default language:'
  });
  if (!defaultLangSelection) return;
  const defaultLang = defaultLangSelection as 'en' | 'es';

  const options: I18nOptions = {
    scopeName,
    defaultLang
  };

  await generateI18n(uri.fsPath, options);
}

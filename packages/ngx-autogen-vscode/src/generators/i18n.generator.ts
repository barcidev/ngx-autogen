import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';
import { camelize, dasherize } from '../utils/string.utils';
import { writeFileIfNotExists } from '../utils/file.utils';
import { promptToInstallLibraries } from '../utils/install.utils';

export interface I18nOptions {
  scopeName: string;
  defaultLang: 'en' | 'es';
  skipInstallPrompt?: boolean;
}

export async function generateI18n(targetPath: string, options: I18nOptions) {
  const { scopeName: name } = options;
  const nameDash = dasherize(name);
  const nameCamel = camelize(name);
  
  const i18nPath = path.join(targetPath, `${nameDash}.i18n.ts`);

  const i18nContent = `import { TranslocoUtils } from '@barcidev/typed-transloco';

const esCO = {
  title: 'Titulo'
};
const enUS = {
  title: 'Title'
};

export const ${nameCamel}I18n = TranslocoUtils.createScopeConfig('${nameCamel}', {
    'en-US': enUS,
    'es-CO': esCO
  });
`;

  writeFileIfNotExists(i18nPath, i18nContent);

  // Attempt to update component if exists (similar logic to the library's injectStoreAndI18n)
  const files = fs.readdirSync(targetPath);
  const componentFile = files.find(f => f.endsWith('.component.ts'));
  if (componentFile) {
    const compPath = path.join(targetPath, componentFile);
    let compContent = fs.readFileSync(compPath, 'utf8');
    
    if (!compContent.includes('TypedTranslocoDirective')) {
      const constName = `${nameCamel}I18n`;
      compContent = `import { TypedTranslocoDirective, provideTranslocoScopeWrapper } from '@barcidev/typed-transloco';\nimport { ${constName} } from './${nameDash}.i18n';\n` + compContent;
      
      compContent = compContent.replace(/imports:\s*\[/, `imports: [TypedTranslocoDirective, `);
      if (compContent.includes('providers: [')) {
         compContent = compContent.replace(/providers:\s*\[/, `providers: [\n    provideTranslocoScopeWrapper(${constName}),`);
      } else {
         compContent = compContent.replace(/imports:\s*\[(.*?)\]/s, `imports: [$1],\n  providers: [provideTranslocoScopeWrapper(${constName})]`);
      }
      fs.writeFileSync(compPath, compContent, 'utf8');
    }
  }

  const htmlFile = files.find(f => f.endsWith('.component.html'));
  if (htmlFile) {
    const htmlPath = path.join(targetPath, htmlFile);
    let htmlContent = fs.readFileSync(htmlPath, 'utf8');
    const i18nVar = camelize(options.scopeName);
    
    if (!htmlContent.includes(`prefix: '${i18nVar}'`)) {
      htmlContent = `<div *typedTransloco="let t; prefix: '${i18nVar}'">\n  <h1>{{ t('title') }}</h1>\n</div>\n` + htmlContent;
      fs.writeFileSync(htmlPath, htmlContent, 'utf8');
    }
  }

  if (!options.skipInstallPrompt) {
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(targetPath))?.uri.fsPath || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (workspaceFolder) {
      await promptToInstallLibraries(workspaceFolder, {
        regular: ['@barcidev/typed-transloco']
      });
    }
  }

  const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(targetPath))?.uri.fsPath || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (workspaceFolder) {
    await updateAppI18n(i18nPath, nameCamel, workspaceFolder);
    await updateAppConfig(workspaceFolder);
  }

  vscode.window.showInformationMessage(`✅ i18n scope '${name}' generated successfully.`);
}

async function updateAppI18n(i18nPath: string, nameCamel: string, workspaceFolder: string) {
  const files = await vscode.workspace.findFiles('**/app.i18n.ts', '**/node_modules/**');
  let appI18nPath: string;

  if (files.length > 0) {
    appI18nPath = files[0].fsPath;
  } else {
    const userPath = await vscode.window.showInputBox({
      prompt: 'app.i18n.ts no encontrado. Ingresa la ruta del directorio para crearlo (relativa a la raíz):',
      value: 'src/app/i18n'
    });

    if (!userPath) {
      vscode.window.showWarningMessage('No se proporcionó ruta. Se omitió la creación de app.i18n.ts.');
      return;
    }

    const i18nDir = path.join(workspaceFolder, userPath);
    fs.mkdirSync(i18nDir, { recursive: true });
    appI18nPath = path.join(i18nDir, 'app.i18n.ts');

    const initialContent = `export const appI18n = {
};
export type AppI18nType = typeof appI18n;
export type AppLanguageCode = 'en-US' | 'es-CO';

declare module '@barcidev/typed-transloco' {
  export interface AppTranslations extends AppI18nType {}
}
`;
    fs.writeFileSync(appI18nPath, initialContent, 'utf8');
  }

  let content = fs.readFileSync(appI18nPath, 'utf8');
  const constName = `${nameCamel}I18n`;
  const propLine = `[${constName}.scope]: ${constName}.keys`;

  if (!content.includes(propLine)) {
    let relPath = path.relative(path.dirname(appI18nPath), i18nPath).replace(/\\/g, '/').replace(/\.ts$/, '');
    if (!relPath.startsWith('.')) {
      relPath = './' + relPath;
    }

    const importLine = `import { ${constName} } from '${relPath}';`;
    content = `${importLine}\n` + content;

    const objRegex = /export\s+const\s+appI18n\s*=\s*\{/;
    if (objRegex.test(content)) {
      content = content.replace(objRegex, `export const appI18n = {\n  ${propLine},`);
      fs.writeFileSync(appI18nPath, content, 'utf8');
    } else {
      vscode.window.showWarningMessage(`Could not find 'export const appI18n = {' in ${appI18nPath}`);
    }
  }
}

async function updateAppConfig(workspaceFolder: string) {
  const files = await vscode.workspace.findFiles('**/app.config.ts', '**/node_modules/**');
  if (files.length === 0) return;

  const appConfigPath = files[0].fsPath;
  let content = fs.readFileSync(appConfigPath, 'utf8');

  if (content.includes('provideTransloco')) {
    return;
  }

  if (!content.includes('isDevMode')) {
    const angularCoreMatch = content.match(/import\s+\{([^}]+)\}\s+from\s+['"]@angular\/core['"];/);
    if (angularCoreMatch) {
      content = content.replace(angularCoreMatch[0], `import { ${angularCoreMatch[1].trim()}, isDevMode } from '@angular/core';`);
    } else {
      content = `import { isDevMode } from '@angular/core';\n` + content;
    }
  }

  if (!content.includes('provideTransloco')) {
    content = `import { provideTransloco, TranslocoHttpLoader } from '@barcidev/typed-transloco';\n` + content;
  }

  const provideTranslocoStr = `
    provideTransloco({
      config: {
        availableLangs: ['en-US', 'es-CO'],
        defaultLang: 'en-US',
        prodMode: !isDevMode(),
        reRenderOnLangChange: true
      },
      loader: TranslocoHttpLoader
    }),`;

  const providersRegex = /providers:\s*\[/;
  if (providersRegex.test(content)) {
    content = content.replace(providersRegex, `providers: [${provideTranslocoStr}`);
    fs.writeFileSync(appConfigPath, content, 'utf8');
  } else {
    vscode.window.showWarningMessage(`No se encontró 'providers: [' en ${appConfigPath}`);
  }
}

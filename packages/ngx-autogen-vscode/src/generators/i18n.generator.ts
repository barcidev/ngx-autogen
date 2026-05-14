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

  if (!options.skipInstallPrompt) {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (workspaceFolder) {
      await promptToInstallLibraries(workspaceFolder, {
        regular: ['@barcidev/typed-transloco']
      });
    }
  }

  vscode.window.showInformationMessage(`✅ i18n scope '${name}' generated successfully.`);
}

"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateI18n = generateI18n;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const vscode = __importStar(require("vscode"));
const string_utils_1 = require("../utils/string.utils");
const file_utils_1 = require("../utils/file.utils");
const install_utils_1 = require("../utils/install.utils");
async function generateI18n(targetPath, options) {
    const { scopeName: name } = options;
    const nameDash = (0, string_utils_1.dasherize)(name);
    const nameCamel = (0, string_utils_1.camelize)(name);
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
    (0, file_utils_1.writeFileIfNotExists)(i18nPath, i18nContent);
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
            }
            else {
                compContent = compContent.replace(/imports:\s*\[(.*?)\]/s, `imports: [$1],\n  providers: [provideTranslocoScopeWrapper(${constName})]`);
            }
            fs.writeFileSync(compPath, compContent, 'utf8');
        }
    }
    if (!options.skipInstallPrompt) {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(targetPath))?.uri.fsPath || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (workspaceFolder) {
            await (0, install_utils_1.promptToInstallLibraries)(workspaceFolder, {
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
async function updateAppI18n(i18nPath, nameCamel, workspaceFolder) {
    const files = await vscode.workspace.findFiles('**/app.i18n.ts', '**/node_modules/**');
    let appI18nPath;
    if (files.length > 0) {
        appI18nPath = files[0].fsPath;
    }
    else {
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
        }
        else {
            vscode.window.showWarningMessage(`Could not find 'export const appI18n = {' in ${appI18nPath}`);
        }
    }
}
async function updateAppConfig(workspaceFolder) {
    const files = await vscode.workspace.findFiles('**/app.config.ts', '**/node_modules/**');
    if (files.length === 0)
        return;
    const appConfigPath = files[0].fsPath;
    let content = fs.readFileSync(appConfigPath, 'utf8');
    if (content.includes('provideTransloco')) {
        return;
    }
    if (!content.includes('isDevMode')) {
        const angularCoreMatch = content.match(/import\s+\{([^}]+)\}\s+from\s+['"]@angular\/core['"];/);
        if (angularCoreMatch) {
            content = content.replace(angularCoreMatch[0], `import { ${angularCoreMatch[1].trim()}, isDevMode } from '@angular/core';`);
        }
        else {
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
    }
    else {
        vscode.window.showWarningMessage(`No se encontró 'providers: [' en ${appConfigPath}`);
    }
}
//# sourceMappingURL=i18n.generator.js.map
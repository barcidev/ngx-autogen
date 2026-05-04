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
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (workspaceFolder) {
        await (0, install_utils_1.promptToInstallLibraries)(workspaceFolder, ['@barcidev/typed-transloco'], false);
    }
    vscode.window.showInformationMessage(`✅ i18n scope '${name}' generated successfully.`);
}
//# sourceMappingURL=i18n.generator.js.map
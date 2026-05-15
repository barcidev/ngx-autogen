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
exports.generateComponentCommand = generateComponentCommand;
const vscode = __importStar(require("vscode"));
const component_generator_1 = require("../generators/component.generator");
const config_utils_1 = require("../utils/config.utils");
async function generateComponentCommand(uri, interactive = false) {
    if (!uri || !uri.fsPath) {
        vscode.window.showErrorMessage('No folder selected');
        return;
    }
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri)?.uri.fsPath || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    const config = (!interactive && workspaceFolder) ? (0, config_utils_1.getConfig)(workspaceFolder) : null;
    const name = await vscode.window.showInputBox({
        prompt: 'Component name (e.g. product-list, user-profile):',
        validateInput: text => text ? null : 'Component name is required'
    });
    if (!name)
        return;
    let styleExt = config?.styleExt;
    if (!styleExt) {
        styleExt = await vscode.window.showQuickPick(['css', 'scss', 'sass', 'less'], {
            placeHolder: 'Style extension:'
        });
        if (!styleExt)
            return;
    }
    let shouldGenerateStore = config?.component?.generateStore;
    if (shouldGenerateStore === undefined) {
        const generateStoreSelection = await vscode.window.showQuickPick(['Yes', 'No'], {
            placeHolder: 'Generate NgRx Signal Store for this component?'
        });
        if (!generateStoreSelection)
            return;
        shouldGenerateStore = generateStoreSelection === 'Yes';
    }
    let shouldGenerateI18n = config?.component?.generateI18n;
    if (shouldGenerateI18n === undefined) {
        const generateI18nSelection = await vscode.window.showQuickPick(['Yes', 'No'], {
            placeHolder: 'Generate Transloco i18n scope?'
        });
        if (!generateI18nSelection)
            return;
        shouldGenerateI18n = generateI18nSelection === 'Yes';
    }
    let skipTests = config?.skipTests;
    if (skipTests === undefined) {
        const skipSpecSelection = await vscode.window.showQuickPick(['No', 'Yes'], {
            placeHolder: 'Skip spec file?'
        });
        if (!skipSpecSelection)
            return;
        skipTests = skipSpecSelection === 'Yes';
    }
    let storeOptions;
    if (shouldGenerateStore) {
        const entityName = await vscode.window.showInputBox({
            prompt: 'Entity store name (default = component name):',
            value: name
        });
        if (!entityName)
            return;
        let useGroupedLayout = config?.store?.useGroupedLayout;
        if (useGroupedLayout === undefined) {
            const groupedLayoutSelection = await vscode.window.showQuickPick(['No', 'Yes'], {
                placeHolder: 'Use grouped layout for store? (models/ and services/ subfolders)'
            });
            if (!groupedLayoutSelection)
                return;
            useGroupedLayout = groupedLayoutSelection === 'Yes';
        }
        let primaryKey = config?.store?.primaryKey;
        if (!primaryKey) {
            primaryKey = await vscode.window.showInputBox({
                prompt: 'Primary key field name:',
                value: 'id'
            });
            if (!primaryKey)
                return;
        }
        let provideInRoot = config?.store?.provideInRoot;
        if (provideInRoot === undefined) {
            const provideInRootSelection = await vscode.window.showQuickPick(['No', 'Yes'], {
                placeHolder: 'Provide store in root?'
            });
            if (!provideInRootSelection)
                return;
            provideInRoot = provideInRootSelection === 'Yes';
        }
        let defaultLang = config?.store?.pluralizationLang;
        if (!defaultLang && workspaceFolder) {
            defaultLang = (0, config_utils_1.getDefaultLangFromProject)(workspaceFolder) || undefined;
        }
        if (!defaultLang) {
            const defaultLangSelection = await vscode.window.showQuickPick(['en', 'es'], {
                placeHolder: 'Default language for pluralization:'
            });
            if (!defaultLangSelection)
                return;
            defaultLang = defaultLangSelection;
        }
        storeOptions = {
            entityName,
            useGroupedLayout,
            primaryKey,
            provideInRoot,
            defaultLang
        };
    }
    let i18nOptions;
    if (shouldGenerateI18n) {
        const scopeName = await vscode.window.showInputBox({
            prompt: 'Scope name:',
            value: name
        });
        if (!scopeName)
            return;
        let defaultLang;
        if (workspaceFolder) {
            defaultLang = (0, config_utils_1.getDefaultLangFromProject)(workspaceFolder) || undefined;
        }
        if (!defaultLang) {
            const defaultLangSelection = await vscode.window.showQuickPick(['en', 'es'], {
                placeHolder: 'Default language:'
            });
            if (!defaultLangSelection)
                return;
            defaultLang = defaultLangSelection;
        }
        i18nOptions = {
            scopeName,
            defaultLang
        };
    }
    const options = {
        name,
        styleExt,
        skipTests,
        generateStore: shouldGenerateStore,
        storeOptions,
        generateI18n: shouldGenerateI18n,
        i18nOptions
    };
    await (0, component_generator_1.generateComponent)(uri.fsPath, options);
    if (workspaceFolder) {
        await (0, config_utils_1.promptToSaveConfig)(workspaceFolder, {
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
//# sourceMappingURL=generate-component.js.map
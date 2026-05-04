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
async function generateComponentCommand(uri) {
    if (!uri || !uri.fsPath) {
        vscode.window.showErrorMessage('No folder selected');
        return;
    }
    const name = await vscode.window.showInputBox({
        prompt: 'Component name (e.g. product-list, user-profile):',
        validateInput: text => text ? null : 'Component name is required'
    });
    if (!name)
        return;
    const styleExtSelection = await vscode.window.showQuickPick(['css', 'scss', 'sass', 'less'], {
        placeHolder: 'Style extension:'
    });
    if (!styleExtSelection)
        return;
    const styleExt = styleExtSelection;
    const generateStoreSelection = await vscode.window.showQuickPick(['No', 'Yes'], {
        placeHolder: 'Generate NgRx Signal Store for this component?'
    });
    if (!generateStoreSelection)
        return;
    const shouldGenerateStore = generateStoreSelection === 'Yes';
    const generateI18nSelection = await vscode.window.showQuickPick(['No', 'Yes'], {
        placeHolder: 'Generate Transloco i18n scope?'
    });
    if (!generateI18nSelection)
        return;
    const shouldGenerateI18n = generateI18nSelection === 'Yes';
    const skipSpecSelection = await vscode.window.showQuickPick(['No', 'Yes'], {
        placeHolder: 'Skip spec file?'
    });
    if (!skipSpecSelection)
        return;
    const skipTests = skipSpecSelection === 'Yes';
    let storeOptions;
    if (shouldGenerateStore) {
        const entityName = await vscode.window.showInputBox({
            prompt: 'Entity store name (default = component name):',
            value: name
        });
        if (!entityName)
            return;
        const primaryKey = await vscode.window.showInputBox({
            prompt: 'Primary key field name:',
            value: 'id'
        });
        if (!primaryKey)
            return;
        const provideInRootSelection = await vscode.window.showQuickPick(['No', 'Yes'], {
            placeHolder: 'Provide store in root?'
        });
        if (!provideInRootSelection)
            return;
        const provideInRoot = provideInRootSelection === 'Yes';
        const defaultLangSelection = await vscode.window.showQuickPick(['en', 'es'], {
            placeHolder: 'Default language for pluralization:'
        });
        if (!defaultLangSelection)
            return;
        const defaultLang = defaultLangSelection;
        storeOptions = {
            entityName,
            useGroupedLayout: false, // For component local stores, default to non-grouped
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
        const defaultLangSelection = await vscode.window.showQuickPick(['en', 'es'], {
            placeHolder: 'Default language:'
        });
        if (!defaultLangSelection)
            return;
        const defaultLang = defaultLangSelection;
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
}
//# sourceMappingURL=generate-component.js.map
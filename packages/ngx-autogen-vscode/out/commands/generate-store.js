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
exports.generateStoreCommand = generateStoreCommand;
const vscode = __importStar(require("vscode"));
const store_generator_1 = require("../generators/store.generator");
const config_utils_1 = require("../utils/config.utils");
async function generateStoreCommand(uri, interactive = false) {
    if (!uri || !uri.fsPath) {
        vscode.window.showErrorMessage('No folder selected');
        return;
    }
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri)?.uri.fsPath || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    const config = (!interactive && workspaceFolder) ? (0, config_utils_1.getConfig)(workspaceFolder) : null;
    const entityName = await vscode.window.showInputBox({
        prompt: 'Entity name (e.g. product, invoice):',
        validateInput: text => text ? null : 'Entity name is required'
    });
    if (!entityName)
        return;
    const groupedLayoutSelection = await vscode.window.showQuickPick(['No', 'Yes'], {
        placeHolder: 'Use grouped layout? (models/ and services/ subfolders)'
    });
    if (!groupedLayoutSelection)
        return;
    const useGroupedLayout = groupedLayoutSelection === 'Yes';
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
            placeHolder: "Provide in root? (providedIn: 'root')"
        });
        if (!provideInRootSelection)
            return;
        provideInRoot = provideInRootSelection === 'Yes';
    }
    let defaultLang = config?.defaultLang;
    if (!defaultLang) {
        const defaultLangSelection = await vscode.window.showQuickPick(['en', 'es'], {
            placeHolder: 'Default language for pluralization:'
        });
        if (!defaultLangSelection)
            return;
        defaultLang = defaultLangSelection;
    }
    const options = {
        entityName,
        useGroupedLayout,
        primaryKey,
        provideInRoot,
        defaultLang
    };
    await (0, store_generator_1.generateStore)(uri.fsPath, options);
    if (workspaceFolder && !config && !interactive) {
        await (0, config_utils_1.promptToSaveConfig)(workspaceFolder, {
            defaultLang,
            store: {
                primaryKey,
                provideInRoot
            }
        });
    }
}
//# sourceMappingURL=generate-store.js.map
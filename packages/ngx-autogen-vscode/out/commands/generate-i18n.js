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
exports.generateI18nCommand = generateI18nCommand;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const i18n_generator_1 = require("../generators/i18n.generator");
const config_utils_1 = require("../utils/config.utils");
async function generateI18nCommand(uri, interactive = false) {
    if (!uri || !uri.fsPath) {
        vscode.window.showErrorMessage('No folder selected');
        return;
    }
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri)?.uri.fsPath || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    const config = (!interactive && workspaceFolder) ? (0, config_utils_1.getConfig)(workspaceFolder) : null;
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
    if (!scopeName)
        return;
    let defaultLang = config?.defaultLang;
    if (!defaultLang) {
        const defaultLangSelection = await vscode.window.showQuickPick(['en', 'es'], {
            placeHolder: 'Default language:'
        });
        if (!defaultLangSelection)
            return;
        defaultLang = defaultLangSelection;
    }
    const options = {
        scopeName,
        defaultLang
    };
    await (0, i18n_generator_1.generateI18n)(uri.fsPath, options);
    if (workspaceFolder && !config && !interactive) {
        await (0, config_utils_1.promptToSaveConfig)(workspaceFolder, {
            defaultLang
        });
    }
}
//# sourceMappingURL=generate-i18n.js.map
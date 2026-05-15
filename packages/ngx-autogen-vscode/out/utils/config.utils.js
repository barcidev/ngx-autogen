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
exports.getConfigPath = getConfigPath;
exports.getConfig = getConfig;
exports.getDefaultLangFromProject = getDefaultLangFromProject;
exports.saveConfig = saveConfig;
exports.promptToSaveConfig = promptToSaveConfig;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const vscode = __importStar(require("vscode"));
function getConfigPath(workspacePath) {
    return path.join(workspacePath, '.autogen', 'config.json');
}
function getConfig(workspacePath) {
    const configPath = getConfigPath(workspacePath);
    if (fs.existsSync(configPath)) {
        try {
            const content = fs.readFileSync(configPath, 'utf8');
            return JSON.parse(content);
        }
        catch (e) {
            vscode.window.showErrorMessage('Error parsing .autogen/config.json');
        }
    }
    return null;
}
function getDefaultLangFromProject(workspacePath) {
    const appConfigPath = path.join(workspacePath, 'src', 'app', 'app.config.ts');
    if (fs.existsSync(appConfigPath)) {
        const content = fs.readFileSync(appConfigPath, 'utf8');
        const match = content.match(/defaultLang:\s*['"]([^'"]+)['"]/);
        if (match && match[1]) {
            const lang = match[1].toLowerCase();
            if (lang.startsWith('es'))
                return 'es';
            if (lang.startsWith('en'))
                return 'en';
        }
    }
    const appModulePath = path.join(workspacePath, 'src', 'app', 'app.module.ts');
    if (fs.existsSync(appModulePath)) {
        const content = fs.readFileSync(appModulePath, 'utf8');
        const match = content.match(/defaultLang:\s*['"]([^'"]+)['"]/);
        if (match && match[1]) {
            const lang = match[1].toLowerCase();
            if (lang.startsWith('es'))
                return 'es';
            if (lang.startsWith('en'))
                return 'en';
        }
    }
    return null;
}
function saveConfig(workspacePath, config) {
    const configDir = path.join(workspacePath, '.autogen');
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
    }
    const configPath = getConfigPath(workspacePath);
    // Merge with existing config if present
    let finalConfig = config;
    if (fs.existsSync(configPath)) {
        try {
            const existing = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            finalConfig = { ...existing };
            for (const [key, value] of Object.entries(config)) {
                if (value === undefined)
                    continue;
                if (typeof value === 'object' && !Array.isArray(value)) {
                    const cleanValue = Object.fromEntries(Object.entries(value).filter(([_, v]) => v !== undefined));
                    if (Object.keys(cleanValue).length > 0) {
                        finalConfig[key] = { ...(existing[key] || {}), ...cleanValue };
                    }
                }
                else {
                    finalConfig[key] = value;
                }
            }
        }
        catch (e) { }
    }
    fs.writeFileSync(configPath, JSON.stringify(finalConfig, null, 2), 'utf8');
}
async function promptToSaveConfig(workspacePath, config, isInteractive = false) {
    const configPath = getConfigPath(workspacePath);
    const hasConfig = fs.existsSync(configPath);
    if (hasConfig && isInteractive) {
        const overwriteOption = "Sí, sobrescribir";
        const choice = await vscode.window.showInformationMessage("¿Deseas sobrescribir la configuración por defecto con estas nuevas opciones?", overwriteOption, "No");
        if (choice === overwriteOption) {
            saveConfig(workspacePath, config);
            vscode.window.showInformationMessage('Configuración actualizada en .autogen/config.json.');
        }
        return;
    }
    if (hasConfig) {
        let existing = {};
        try {
            existing = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        }
        catch (e) { }
        const hasNewKeys = Object.entries(config).some(([key, value]) => {
            if (value === undefined)
                return false;
            if (typeof value === 'object' && !Array.isArray(value)) {
                return Object.entries(value).some(([subKey, subValue]) => {
                    return subValue !== undefined && existing[key]?.[subKey] === undefined;
                });
            }
            return existing[key] === undefined;
        });
        if (!hasNewKeys) {
            return; // Already configured and no new missing keys, so do nothing
        }
    }
    const saveOption = hasConfig ? "Sí, actualizar configuración" : "Sí, guardar configuración";
    const message = hasConfig
        ? "¿Deseas agregar estas opciones faltantes a .autogen/config.json para acelerar futuras generaciones?"
        : "¿Quieres guardar estas opciones como predeterminadas en .autogen/config.json para acelerar futuras generaciones?";
    const choice = await vscode.window.showInformationMessage(message, saveOption, "No por ahora");
    if (choice === saveOption) {
        saveConfig(workspacePath, config);
        vscode.window.showInformationMessage(hasConfig ? 'Configuración actualizada en .autogen/config.json.' : 'Configuración guardada en .autogen/config.json. La próxima vez será instantáneo.');
    }
}
//# sourceMappingURL=config.utils.js.map
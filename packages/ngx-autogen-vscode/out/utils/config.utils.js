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
            finalConfig = { ...existing, ...config };
        }
        catch (e) { }
    }
    fs.writeFileSync(configPath, JSON.stringify(finalConfig, null, 2), 'utf8');
}
async function promptToSaveConfig(workspacePath, config) {
    // If config already exists and is not completely empty, we might not want to bother them,
    // or we can silently update, but auto-saving without explicit consent initially is bad UX.
    // We'll ask if no config exists.
    if (fs.existsSync(getConfigPath(workspacePath))) {
        return; // Already configured
    }
    const saveOption = "Sí, guardar configuración";
    const choice = await vscode.window.showInformationMessage("¿Quieres guardar estas opciones como predeterminadas en .autogen/config.json para acelerar futuras generaciones?", saveOption, "No por ahora");
    if (choice === saveOption) {
        saveConfig(workspacePath, config);
        vscode.window.showInformationMessage('Configuración guardada en .autogen/config.json. La próxima vez será instantáneo.');
    }
}
//# sourceMappingURL=config.utils.js.map
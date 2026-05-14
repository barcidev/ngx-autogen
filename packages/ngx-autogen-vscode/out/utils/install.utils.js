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
exports.promptToInstallLibraries = promptToInstallLibraries;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
async function promptToInstallLibraries(workspacePath, config) {
    const missingRegular = [];
    const missingDev = [];
    const packageJsonPath = path.join(workspacePath, 'package.json');
    let allDeps = {};
    if (fs.existsSync(packageJsonPath)) {
        try {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
        }
        catch (e) {
            // Ignore parse error
        }
    }
    if (config.regular) {
        for (const lib of config.regular) {
            if (!allDeps[lib]) {
                missingRegular.push(lib);
            }
        }
    }
    if (config.dev) {
        for (const lib of config.dev) {
            if (!allDeps[lib]) {
                missingDev.push(lib);
            }
        }
    }
    if (missingRegular.length === 0 && missingDev.length === 0) {
        return;
    }
    const libsToInstall = [...missingRegular, ...missingDev].join(' ');
    const installOption = "Install (npm)";
    const choice = await vscode.window.showInformationMessage(`⚠️ Some generated files require dependencies. Install ${libsToInstall}?`, installOption, "Skip");
    if (choice === installOption) {
        const terminalName = "ngx-autogen install";
        const terminal = vscode.window.terminals.find(t => t.name === terminalName) || vscode.window.createTerminal(terminalName);
        terminal.show();
        let command = '';
        if (missingRegular.length > 0) {
            command += `npm install ${missingRegular.join(' ')} --save`;
        }
        if (missingDev.length > 0) {
            if (command) {
                command += ' && ';
            }
            command += `npm install ${missingDev.join(' ')} --save-dev`;
        }
        if (command) {
            terminal.sendText(command);
        }
    }
}
//# sourceMappingURL=install.utils.js.map
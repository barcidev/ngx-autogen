import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export interface InstallConfig {
  regular?: string[];
  dev?: string[];
}

export async function promptToInstallLibraries(workspacePath: string, config: InstallConfig) {
  const missingRegular: string[] = [];
  const missingDev: string[] = [];

  const packageJsonPath = path.join(workspacePath, 'package.json');
  let allDeps: Record<string, string> = {};
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    } catch (e) {
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
  const choice = await vscode.window.showInformationMessage(
    `⚠️ Some generated files require dependencies. Install ${libsToInstall}?`,
    installOption,
    "Skip"
  );

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

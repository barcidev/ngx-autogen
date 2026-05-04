import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export async function promptToInstallLibraries(workspacePath: string, libraries: string[], dev: boolean = true) {
  const missingLibraries: string[] = [];

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

  for (const lib of libraries) {
    if (!allDeps[lib]) {
      missingLibraries.push(lib);
    }
  }

  if (missingLibraries.length === 0) {
    return;
  }

  const libsString = missingLibraries.join(' ');
  const installOption = "Install (npm)";
  const choice = await vscode.window.showInformationMessage(
    `⚠️ Some generated files require dependencies. Install ${libsString}?`,
    installOption,
    "Skip"
  );

  if (choice === installOption) {
    const terminal = vscode.window.createTerminal("ngx-autogen install");
    terminal.show();
    const saveFlag = dev ? '--save-dev' : '--save';
    terminal.sendText(`npm install ${libsString} ${saveFlag}`);
  }
}

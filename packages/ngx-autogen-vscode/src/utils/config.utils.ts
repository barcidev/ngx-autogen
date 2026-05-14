import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';

export interface AutogenConfig {
  styleExt?: string;
  skipTests?: boolean;
  defaultLang?: 'en' | 'es';
  component?: {
    generateStore?: boolean;
    generateI18n?: boolean;
  };
  store?: {
    primaryKey?: string;
    provideInRoot?: boolean;
  };
}

export function getConfigPath(workspacePath: string): string {
  return path.join(workspacePath, '.autogen', 'config.json');
}

export function getConfig(workspacePath: string): AutogenConfig | null {
  const configPath = getConfigPath(workspacePath);
  if (fs.existsSync(configPath)) {
    try {
      const content = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(content) as AutogenConfig;
    } catch (e) {
      vscode.window.showErrorMessage('Error parsing .autogen/config.json');
    }
  }
  return null;
}

export function saveConfig(workspacePath: string, config: AutogenConfig): void {
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
    } catch (e) {}
  }
  
  fs.writeFileSync(configPath, JSON.stringify(finalConfig, null, 2), 'utf8');
}

export async function promptToSaveConfig(workspacePath: string, config: AutogenConfig): Promise<void> {
  // If config already exists and is not completely empty, we might not want to bother them,
  // or we can silently update, but auto-saving without explicit consent initially is bad UX.
  // We'll ask if no config exists.
  if (fs.existsSync(getConfigPath(workspacePath))) {
    return; // Already configured
  }

  const saveOption = "Sí, guardar configuración";
  const choice = await vscode.window.showInformationMessage(
    "¿Quieres guardar estas opciones como predeterminadas en .autogen/config.json para acelerar futuras generaciones?",
    saveOption,
    "No por ahora"
  );

  if (choice === saveOption) {
    saveConfig(workspacePath, config);
    vscode.window.showInformationMessage('Configuración guardada en .autogen/config.json. La próxima vez será instantáneo.');
  }
}

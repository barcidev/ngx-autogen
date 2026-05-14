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
    useGroupedLayout?: boolean;
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
  let finalConfig: any = config;
  if (fs.existsSync(configPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      finalConfig = { ...existing };
      
      for (const [key, value] of Object.entries(config)) {
        if (value === undefined) continue;
        
        if (typeof value === 'object' && !Array.isArray(value)) {
          const cleanValue = Object.fromEntries(Object.entries(value).filter(([_, v]) => v !== undefined));
          if (Object.keys(cleanValue).length > 0) {
            finalConfig[key] = { ...(existing[key] || {}), ...cleanValue };
          }
        } else {
          finalConfig[key] = value;
        }
      }
    } catch (e) {}
  }
  
  fs.writeFileSync(configPath, JSON.stringify(finalConfig, null, 2), 'utf8');
}

export async function promptToSaveConfig(workspacePath: string, config: AutogenConfig, isInteractive: boolean = false): Promise<void> {
  const configPath = getConfigPath(workspacePath);
  const hasConfig = fs.existsSync(configPath);

  if (hasConfig && isInteractive) {
    const overwriteOption = "Sí, sobrescribir";
    const choice = await vscode.window.showInformationMessage(
      "¿Deseas sobrescribir la configuración por defecto con estas nuevas opciones?",
      overwriteOption,
      "No"
    );

    if (choice === overwriteOption) {
      saveConfig(workspacePath, config);
      vscode.window.showInformationMessage('Configuración actualizada en .autogen/config.json.');
    }
    return;
  }

  if (hasConfig) {
    let existing: AutogenConfig = {};
    try {
      existing = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch(e) {}
    
    const hasNewKeys = Object.entries(config).some(([key, value]) => {
      if (value === undefined) return false;
      if (typeof value === 'object' && !Array.isArray(value)) {
         return Object.entries(value).some(([subKey, subValue]) => {
           return subValue !== undefined && (existing as any)[key]?.[subKey] === undefined;
         });
      }
      return (existing as any)[key] === undefined;
    });

    if (!hasNewKeys) {
      return; // Already configured and no new missing keys, so do nothing
    }
  }

  const saveOption = hasConfig ? "Sí, actualizar configuración" : "Sí, guardar configuración";
  const message = hasConfig 
    ? "¿Deseas agregar estas opciones faltantes a .autogen/config.json para acelerar futuras generaciones?"
    : "¿Quieres guardar estas opciones como predeterminadas en .autogen/config.json para acelerar futuras generaciones?";

  const choice = await vscode.window.showInformationMessage(
    message,
    saveOption,
    "No por ahora"
  );

  if (choice === saveOption) {
    saveConfig(workspacePath, config);
    vscode.window.showInformationMessage(
      hasConfig ? 'Configuración actualizada en .autogen/config.json.' : 'Configuración guardada en .autogen/config.json. La próxima vez será instantáneo.'
    );
  }
}

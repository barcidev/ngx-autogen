import {
  apply,
  applyTemplates,
  chain,
  externalSchematic,
  mergeWith,
  move,
  Rule,
  SchematicContext,
  SchematicsException,
  strings,
  Tree,
  url,
} from "@angular-devkit/schematics";
import { getWorkspace } from "@schematics/angular/utility/workspace";
import { applyEdits, ModificationOptions, modify } from "jsonc-parser";
import { join, normalize } from "path";

// Utilidades locales
import { addMetadataToStandaloneComponent } from "../common/file-actions";
import { pluralizeEn, pluralizeEs } from "../common/pluralize";
import { TranslocoSchemaOptions } from "./schema";

export function transloco(options: TranslocoSchemaOptions): Rule {
  return async (tree: Tree) => {
    const workspace = await getWorkspace(tree);

    // 1. Configuración de Proyecto y Roots
    const projectName =
      options.project ||
      (workspace.extensions.defaultProject as string) ||
      Array.from(workspace.projects.keys())[0];
    const project = workspace.projects.get(projectName);
    if (!project)
      throw new SchematicsException(`El proyecto "${projectName}" no existe.`);

    const projectRoot = project.sourceRoot || "src";

    // 2. Resolución de Contexto (Path y Componente)
    const { path, componentFile, componentName } = resolveComponentContext(
      tree,
      options,
    );

    // Sincronizamos las opciones normalizadas
    const finalOptions = {
      ...options,
      name: componentName,
      path: path,
      project: projectName,
      projectRoot: projectRoot,
    };

    return chain([
      ensureExternalConfig(),
      generateI18nFiles(finalOptions),
      updateAppI18nTypeRule(finalOptions),
      registerProviderInComponent(finalOptions, componentFile),
    ]);
  };
}

/**
 * --- REGLAS FUNCIONALES ---
 */

/**
 * Verifica si se requiere el setup global y lo ejecuta.
 * Esto evita el Overlapping edit al no leer archivos antes de tiempo.
 */
function ensureExternalConfig(): Rule {
  return (tree: Tree) => {
    const appConfigPath = "src/app/app.config.ts";
    const exists = tree.exists(appConfigPath);

    if (exists) {
      const content = tree.read(appConfigPath)!.toString();
      if (!content.includes("provideTransloco")) {
        // Al retornar el externalSchematic aquí, Angular CLI
        // gestiona la creación de archivos global antes de pasar a la siguiente regla del chain
        return externalSchematic("@barcidev/typed-transloco", "ng-add", {});
      }
    }
    return tree;
  };
}

// Generación de archivos desde plantillas
function generateI18nFiles(options: any): Rule {
  return mergeWith(
    apply(url("./files/component"), [
      applyTemplates({
        ...strings,
        ...options,
        pluralize: (word: string) =>
          options.lang === "es" ? pluralizeEs(word) : pluralizeEn(word),
      }),
      move(options.path),
    ]),
  );
}

// Actualización del archivo de tipos global
function updateAppI18nTypeRule(options: any): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const i18nFilePath = `${options.projectRoot}/app/i18n/app.i18n.ts`;
    const buffer = tree.read(i18nFilePath);

    if (!buffer) {
      context.logger.warn(
        `⚠️ No se encontró app.i18n.ts en ${i18nFilePath}. Salteando actualización de tipos.`,
      );
      return tree;
    }

    let content = buffer.toString();
    const camelName = strings.camelize(options.name);
    const i18nConstantName = `${camelName}I18n`;

    // Inyección de Import
    const importStatement = `import { ${i18nConstantName} } from '${options.path}/${strings.dasherize(options.name)}.i18n';\n`;
    if (!content.includes(i18nConstantName)) {
      content = importStatement + content;
    }

    // Modificación del objeto appI18n
    const jsonOptions: ModificationOptions = {
      formattingOptions: { insertSpaces: true, tabSize: 2 },
    };
    const regex = /const\s+appI18n\s*=\s*(\{[\s\S]*?\});/;
    const match = content.match(regex);

    if (match) {
      const oldObjectStr = match[1];
      const propertyKey = camelName;
      const propertyValue = `${i18nConstantName}.translations['en-US']`;

      // Placeholder para evitar comillas de JSON
      const placeholder = `__REF__${i18nConstantName}`;
      const edits = modify(
        oldObjectStr,
        [propertyKey],
        placeholder,
        jsonOptions,
      );
      let newObjectStr = applyEdits(oldObjectStr, edits);

      newObjectStr = newObjectStr.replace(`"${placeholder}"`, propertyValue);
      tree.overwrite(i18nFilePath, content.replace(oldObjectStr, newObjectStr));
      context.logger.info(
        `✅ Tipos actualizados para el scope: ${propertyKey}`,
      );
    }

    return tree;
  };
}

// Registro de Provider en el componente
function registerProviderInComponent(
  options: any,
  componentFile?: string,
): Rule {
  if (!componentFile) return (tree: Tree) => tree;

  const componentPath = join(options.path, componentFile);
  const i18nConstantName = `${strings.camelize(options.name)}I18n`;

  return chain([
    addMetadataToStandaloneComponent(
      componentPath,
      `provideTranslocoScopeWrapper(${i18nConstantName})`,
      [
        {
          symbol: "provideTranslocoScopeWrapper",
          path: "@barcidev/typed-transloco",
        },
        {
          symbol: i18nConstantName,
          path: `./${strings.dasherize(options.name)}.i18n`,
        },
      ],
      "providers",
    ),
    addMetadataToStandaloneComponent(
      componentPath,
      "AppTypedTranslocoDirective",
      [
        {
          symbol: "AppTypedTranslocoDirective",
          path: "@i18n/app-typed-transloco.directive",
        },
      ],
    ),
  ]);
}

/**
 * --- HELPERS ---
 */

function resolveComponentContext(tree: Tree, options: TranslocoSchemaOptions) {
  const fullPath = process.cwd();
  const srcIndex = fullPath.lastIndexOf("src");
  const path = normalize(
    srcIndex !== -1
      ? fullPath.substring(srcIndex)
      : join(normalize("src"), "app"),
  );

  const directory = tree.getDir(path);
  const componentFile =
    directory.subfiles.find((f) => f.endsWith(".component.ts")) ||
    directory.subfiles.find((f) => f.endsWith(".ts"));

  const componentName = componentFile
    ? componentFile.replace(".component.ts", "").replace(".ts", "")
    : options.name;

  if (!componentName)
    throw new SchematicsException(
      "❌ No se pudo determinar el nombre del componente.",
    );

  return { path, componentFile, componentName };
}

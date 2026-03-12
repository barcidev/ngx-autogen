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
import {
  getWorkspace,
  ProjectDefinition,
} from "@schematics/angular/utility/workspace";
import { applyEdits, ModificationOptions, modify } from "jsonc-parser";
import { join, normalize } from "path";

// Utilidades locales
import { addMetadataToStandaloneComponent } from "../common/file-actions";
import { pluralizeEn, pluralizeEs } from "../common/pluralize";
import { TranslocoSchemaOptions } from "./types/types";

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
    const { path, componentFile, componentName } = resolveTranslocoContext(
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
      ensureExternalConfig(project),
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
export function ensureExternalConfig(project: ProjectDefinition): Rule {
  return async (tree: Tree) => {
    // Buscamos posibles archivos donde se registran providers
    const configFiles = [
      "src/app/app.config.ts", // Estándar Standalone
      "src/app/app.module.ts", // Estándar basado en Módulos
      getProjectMainFile(project), // Archivo definido en angular.json
    ];

    let providerExists = false;

    for (const path of configFiles) {
      if (path && tree.exists(path)) {
        const content = tree.read(path)!.toString();
        // Usamos Regex simple o mejor aún, validamos el string
        if (
          content.includes("provideTransloco") ||
          content.includes("TranslocoRootModule")
        ) {
          providerExists = true;
          break;
        }
      }
    }

    if (!providerExists) {
      return externalSchematic("@barcidev/typed-transloco", "ng-add", {});
    }

    return tree;
  };
}

// Función auxiliar para obtener el "main" desde la configuración del proyecto
function getProjectMainFile(project: ProjectDefinition): string | undefined {
  const buildOptions = project.targets.get("build")?.options;
  return buildOptions?.main as string | undefined;
}

// Generación de archivos desde plantillas
function generateI18nFiles(options: TranslocoSchemaOptions): Rule {
  return mergeWith(
    apply(url("./files/component"), [
      applyTemplates({
        ...strings,
        ...options,
        pluralize: (word: string) =>
          options.lang === "es" ? pluralizeEs(word) : pluralizeEn(word),
      }),
      move(options.path || "src/app"),
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

      // 1. Definimos placeholders únicos para la llave y el valor
      const keyPlaceholder = `__KEY_REF__${i18nConstantName}`;
      const valuePlaceholder = `__VAL_REF__${i18nConstantName}`;

      // 2. Aplicamos los cambios usando los placeholders
      const edits = modify(
        oldObjectStr,
        [keyPlaceholder], // Usamos el placeholder como llave temporal
        valuePlaceholder, // Usamos el placeholder como valor temporal
        jsonOptions,
      );

      let newObjectStr = applyEdits(oldObjectStr, edits);

      // 3. Reemplazamos los placeholders por el código real (sin comillas)
      const realKey = `[${i18nConstantName}.scope]`;
      const realValue = `${i18nConstantName}.translations['en-US'],`;

      newObjectStr = newObjectStr
        .replace(`"${keyPlaceholder}"`, realKey) // Limpia la llave
        .replace(`"${valuePlaceholder}"`, realValue); // Limpia el valor

      // 4. Escribimos en el archivo
      tree.overwrite(i18nFilePath, content.replace(oldObjectStr, newObjectStr));

      context.logger.info(`✅ Tipos actualizados para el scope: ${realKey}`);
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

function resolveTranslocoContext(tree: Tree, options: TranslocoSchemaOptions) {
  const fullPath = process.cwd();
  const srcIndex = fullPath.lastIndexOf("src");
  const path =
    options.path ||
    normalize(
      srcIndex !== -1
        ? fullPath.substring(srcIndex)
        : join(normalize("src"), "app"),
    );

  let componentName = options.name;
  const directory = tree.getDir(path);
  const componentFile =
    directory.subfiles.find((f) => f.endsWith(".component.ts")) ||
    directory.subfiles.find((f) => f.endsWith(".ts"));

  if (!options.name) {
    componentName =
      componentFile?.replace(".component.ts", "").replace(".ts", "") || "file";
  }

  if (!componentName)
    throw new SchematicsException(
      "❌ No se pudo determinar el nombre del componente.",
    );

  return { path, componentFile, componentName };
}

import { join, normalize, strings } from "@angular-devkit/core";
import {
  apply,
  applyTemplates,
  chain,
  mergeWith,
  move,
  Rule,
  SchematicContext,
  SchematicsException,
  Tree,
  url,
} from "@angular-devkit/schematics";
import { NodePackageInstallTask } from "@angular-devkit/schematics/tasks";
import {
  addPackageJsonDependency,
  NodeDependencyType,
} from "@schematics/angular/utility/dependencies";
import {
  getWorkspace,
  WorkspaceDefinition,
} from "@schematics/angular/utility/workspace";
import { applyEdits, ModificationOptions, modify, parse } from "jsonc-parser";
import { mergeFilesSmart } from "../../common/file-actions";
import { pluralizeEn, pluralizeEs } from "../../common/pluralize";
import { StoreSchemaOptions } from "./schema";

const NGRX_SIGNALS = "@ngrx/signals";

export function signalStore(options: StoreSchemaOptions): Rule {
  return async (tree: Tree) => {
    const workspace = await getWorkspace(tree);

    // 1. Preparar contexto y opciones enriquecidas
    const context = resolveStoreContext(workspace, options);
    const project = workspace.projects.get(context.projectName);
    const projectRoot = project?.sourceRoot || "src";

    const { angularVersion } = getProjectMetadata(tree);

    // 2. Orquestar la ejecución
    return chain([
      ensureNgrxSignals(angularVersion),
      updateIndexFile(context),
      generateStoreFiles(context),
      mergeFilesSmart(
        "./files/entity",
        "src/app/shared/state",
        context.options,
        tree,
      ),
      updateAngularJson(context.options),
      updateTsConfigRule(projectRoot),
      (host: Tree, context: SchematicContext) => {
        context.addTask(new NodePackageInstallTask());
        context.logger.info("🚀 Entorno preparado con éxito.");
        return host;
      },
    ]);
  };
}

/**
 * --- LÓGICA DE EXTRACCIÓN Y PREPARACIÓN ---
 */

function getProjectMetadata(tree: Tree) {
  const buffer = tree.read("package.json");
  if (!buffer) throw new SchematicsException("No se encontró package.json");
  const packageJson = JSON.parse(buffer.toString());
  const angularCore =
    packageJson.dependencies?.["@angular/core"] ||
    packageJson.devDependencies?.["@angular/core"];
  const angularVersion = parseInt(
    angularCore.replace(/[^\d.]/g, "").split(".")[0],
    10,
  );
  return { angularVersion };
}

function resolveStoreContext(
  workspace: WorkspaceDefinition,
  options: StoreSchemaOptions,
) {
  // Configuración Global de PK
  const globalConfig = (workspace.extensions as any).schematics?.[
    "@barcidev/ngx-autogen:all"
  ];
  const lang = options.lang || globalConfig?.lang || "en";

  // Resolución de Rutas (Lógica de Directorio Actual)
  const fullPath = process.cwd();
  const srcIndex = fullPath.lastIndexOf("src");
  let relativePath =
    srcIndex !== -1
      ? fullPath.substring(srcIndex)
      : join(normalize("src"), "app");

  let movePath = normalize(relativePath);
  if (!movePath.endsWith("state")) movePath = join(movePath, "state");

  // Resolución de Proyecto
  const projectName: string =
    options.project ||
    (workspace.extensions.defaultProject as string) ||
    Array.from(workspace.projects.keys())[0];

  return {
    options: { ...options, lang, path: movePath, project: projectName },
    projectName,
    movePath,
    indexPath: join(movePath, "index.ts"),
    nameDash: strings.dasherize(options.name),
    entityName: strings.classify(options.name),
  };
}

/**
 * --- REGLAS DE TRANSFORMACIÓN ---
 */

/**
 * Regla: Añade @ngrx/signals si no existe
 */
function ensureNgrxSignals(version: number): Rule {
  return (tree: Tree) => {
    addPackageJsonDependency(tree, {
      type: NodeDependencyType.Default,
      name: NGRX_SIGNALS,
      version: `^${version}.0.0`,
      overwrite: false, // NO sobreescribe si ya está instalado
    });
    return tree;
  };
}

function updateIndexFile(ctx: any): Rule {
  return (tree: Tree) => {
    const { options, indexPath, nameDash, entityName } = ctx;
    const entityHeader = `/* ${entityName.toUpperCase()} */`;

    const exportBlock = [
      entityHeader,
      `export * from './${nameDash}${options.grouped ? "/models" : ""}/${nameDash}.model';`,
      `export * from './${nameDash}${options.grouped ? "/services" : ""}/${nameDash}.service';`,
      `export * from './${nameDash}/${nameDash}.store';`,
      "",
    ].join("\n");

    let content = tree.exists(indexPath)
      ? tree.read(indexPath)!.toString()
      : "";

    if (content.includes(entityHeader)) {
      // Evitar duplicados línea por línea
      const newLines = exportBlock
        .split("\n")
        .filter((line) => line.trim() !== "" && !content.includes(line));
      if (newLines.length > 0) content += newLines.join("\n") + "\n";
    } else {
      content =
        content.trim() + (content.length > 0 ? "\n\n" : "") + exportBlock;
    }

    tree.exists(indexPath)
      ? tree.overwrite(indexPath, content)
      : tree.create(indexPath, content);
    return tree;
  };
}

function generateStoreFiles(ctx: any): Rule {
  const { options, movePath, nameDash } = ctx;
  const targetPath = join(movePath, nameDash);

  const templateUtils = {
    ...strings,
    ...options,
    pluralize: (word: string) =>
      options.lang === "es" ? pluralizeEs(word) : pluralizeEn(word),
  };

  const createSource = (srcUrl: string, dest: string) =>
    mergeWith(apply(url(srcUrl), [applyTemplates(templateUtils), move(dest)]));

  return chain([
    createSource("./files/state/store", targetPath),
    createSource(
      "./files/state/services",
      join(targetPath, options.grouped ? "services" : ""),
    ),
    createSource(
      "./files/state/models",
      join(targetPath, options.grouped ? "models" : ""),
    ),
  ]);
}

function updateTsConfigRule(root: string): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const tsConfigPath = tree.exists("/tsconfig.app.json")
      ? "/tsconfig.app.json"
      : "/tsconfig.json";
    const buffer = tree.read(tsConfigPath);
    if (!buffer) return;

    let content = buffer.toString();
    const modOptions: ModificationOptions = {
      formattingOptions: { insertSpaces: true, tabSize: 2 },
    };

    // 1. Asegurar baseUrl
    if (!parse(content).compilerOptions?.baseUrl) {
      content = applyEdits(
        content,
        modify(content, ["compilerOptions", "baseUrl"], "./", modOptions),
      );
    }

    // 2. Calcular path relativo al baseUrl
    const baseUrl = parse(content).compilerOptions?.baseUrl || "./";
    let i18nPath = `${root}/app/shared/state/*`;
    const normalizedBase = baseUrl.replace(/^\.\/|\/$/g, "");

    if (normalizedBase && i18nPath.startsWith(normalizedBase)) {
      i18nPath = i18nPath.replace(normalizedBase, "").replace(/^\//, "");
    }

    // 3. Aplicar alias
    const finalContent = applyEdits(
      content,
      modify(
        content,
        ["compilerOptions", "paths", "@shared-state/*"],
        [i18nPath],
        modOptions,
      ),
    );

    tree.overwrite(tsConfigPath, finalContent);
    context.logger.info(`✅ Alias @shared-state configurado.`);
  };
}

function updateAngularJson(options: StoreSchemaOptions) {
  return (tree: Tree) => {
    const path = "/angular.json";
    const buffer = tree.read(path);
    if (!buffer) return;

    const workspace = JSON.parse(buffer.toString());

    if (!workspace.schematics) workspace.schematics = {};
    workspace.schematics["@barcidev/ngx-autogen:signal-state"] = {
      pk: options.pk,
      lang: options.lang,
    };
    tree.overwrite(path, JSON.stringify(workspace, null, 2));
  };
}

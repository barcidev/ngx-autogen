import { join, normalize, strings } from "@angular-devkit/core";
import { Project, QuoteKind } from "ts-morph";
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
  getPackageJsonDependency,
  NodeDependencyType,
} from "@schematics/angular/utility/dependencies";
import {
  getWorkspace,
  WorkspaceDefinition,
} from "@schematics/angular/utility/workspace";
import { applyEdits, ModificationOptions, modify, parse } from "jsonc-parser";
import { pluralizeEn, pluralizeEs } from "../../common/pluralize";
import { getProjectMetadata } from "../../common/project-metadata";
import { StoreSchemaOptions } from "./types/types";

const NGRX_SIGNALS = "@ngrx/signals";
let _needsInstall = false;

export function signalStore(options: StoreSchemaOptions): Rule {
  return async (tree: Tree) => {
    _needsInstall = false;
    const workspace = await getWorkspace(tree);

    // 1. Preparar contexto y opciones enriquecidas
    const context = resolveStoreContext(workspace, options);
    const project = workspace.projects.get(
      options.project || context.projectName,
    );
    if (!project)
      throw new SchematicsException(
        `El proyecto "${options.project || context.projectName}" no existe.`,
      );
    const projectRoot = project?.sourceRoot || "src";

    const { angularVersion } = getProjectMetadata(tree);

    // 2. Orquestar la ejecución
    return chain([
      ensureNgrxSignals(angularVersion),
      updateIndexFile(context),
      generateStoreFiles(context),
      updateAngularJson(context.options),
      updateTsConfigRule(projectRoot),
      (host: Tree, ctx: SchematicContext) => {
        if (_needsInstall) {
          ctx.addTask(new NodePackageInstallTask());
          ctx.logger.info("📦 Instalando dependencias...");
        }
        ctx.logger.info("🚀 Entorno preparado con éxito.");
        return host;
      },
    ]);
  };
}

/**
 * --- LÓGICA DE EXTRACCIÓN Y PREPARACIÓN ---
 */

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
    options.path ||
    (srcIndex !== -1
      ? fullPath.substring(srcIndex)
      : join(normalize("src"), "app"));

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
    const existingDep = getPackageJsonDependency(tree, NGRX_SIGNALS);

    if (existingDep) return tree;

    addPackageJsonDependency(tree, {
      type: NodeDependencyType.Default,
      name: NGRX_SIGNALS,
      version: `^${version}.0.0`,
      overwrite: false,
    });

    _needsInstall = true;
    return tree;
  };
}

function updateIndexFile(ctx: any): Rule {
  return (tree: Tree) => {
    const { options, indexPath, nameDash } = ctx;

    let content = tree.exists(indexPath)
      ? tree.read(indexPath)!.toString()
      : "";

    const project = new Project({
      manipulationSettings: { quoteKind: QuoteKind.Single }
    });
    const sourceFile = project.createSourceFile('index.ts', content);

    const exportsToAdd = [
      `./${nameDash}${options.grouped ? "/models" : ""}/${nameDash}.model`,
      `./${nameDash}${options.grouped ? "/services" : ""}/${nameDash}.service`,
      `./${nameDash}/${nameDash}.store`
    ];

    const currentExports = sourceFile.getExportDeclarations().map(e => e.getModuleSpecifierValue());

    for (const exp of exportsToAdd) {
      if (!currentExports.includes(exp)) {
        sourceFile.addExportDeclaration({ moduleSpecifier: exp });
      }
    }

    const newContent = sourceFile.getFullText();

    tree.exists(indexPath)
      ? tree.overwrite(indexPath, newContent)
      : tree.create(indexPath, newContent);

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
    const parsed = parse(content);

    // Calcular el path esperado del alias
    const baseUrl = parsed.compilerOptions?.baseUrl || "./";
    let i18nPath = `${root}/app/shared/state/*`;
    const normalizedBase = baseUrl.replace(/^\.\/|\/$/g, "");
    if (normalizedBase && i18nPath.startsWith(normalizedBase)) {
      i18nPath = i18nPath.replace(normalizedBase, "").replace(/^\//, "");
    }

    // Verificar si ya tiene baseUrl y el alias correcto
    const existingPaths = parsed.compilerOptions?.paths?.["@shared-state/*"];
    const alreadyConfigured =
      parsed.compilerOptions?.baseUrl &&
      Array.isArray(existingPaths) &&
      existingPaths.length === 1 &&
      existingPaths[0] === i18nPath;

    if (alreadyConfigured) return;

    const modOptions: ModificationOptions = {
      formattingOptions: { insertSpaces: true, tabSize: 2 },
    };

    if (!parsed.compilerOptions?.baseUrl) {
      content = applyEdits(
        content,
        modify(content, ["compilerOptions", "baseUrl"], "./", modOptions),
      );
    }

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
    const existing = workspace.schematics?.["@barcidev/ngx-autogen:signal-state"];

    if (existing?.pk === options.pk && existing?.lang === options.lang) return;

    if (!workspace.schematics) workspace.schematics = {};
    workspace.schematics["@barcidev/ngx-autogen:signal-state"] = {
      pk: options.pk,
      lang: options.lang,
    };
    tree.overwrite(path, JSON.stringify(workspace, null, 2));
  };
}

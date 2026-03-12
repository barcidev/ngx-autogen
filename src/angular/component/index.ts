import {
  apply,
  applyTemplates,
  chain,
  mergeWith,
  move,
  noop,
  Rule,
  schematic,
  strings,
  Tree,
  url,
} from "@angular-devkit/schematics";
import {
  getWorkspace,
  WorkspaceDefinition,
} from "@schematics/angular/utility/workspace";
import { join, normalize } from "path";
import { pluralizeEn, pluralizeEs } from "../../common/pluralize";
import { ComponentContext, ComponentSchemaOptions } from "./types/types";

export function component(options: ComponentSchemaOptions): Rule {
  return async (tree: Tree) => {
    const workspace = await getWorkspace(tree);

    // 1. Preparar contexto y opciones enriquecidas
    const context = resolveComponentContext(workspace, options);

    // Aquí podrías agregar más reglas para otras funcionalidades, como NgRx

    return chain([
      generateComponentFiles(context),
      options.i18n === "Yes"
        ? schematic("app-i18n", {
            name: context.options.name,
            path: join(context.movePath, context.nameDash),
          })
        : noop(),
      options.store === "Yes"
        ? schematic("app-store", {
            name: context.options.name,
            path: join(context.movePath, context.nameDash),
          })
        : noop(),
    ]);
  };
}

/**
 * --- LÓGICA DE EXTRACCIÓN Y PREPARACIÓN ---
 */

function resolveComponentContext(
  workspace: WorkspaceDefinition,
  options: ComponentSchemaOptions,
): ComponentContext {
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

  // Resolución de Proyecto
  const projectName: string =
    options.project ||
    (workspace.extensions.defaultProject as string) ||
    Array.from(workspace.projects.keys())[0];

  return {
    options: { ...options, lang, path: movePath, project: projectName },
    projectName,
    movePath,
    nameDash: strings.dasherize(options.name),
    entityName: strings.classify(options.name),
  };
}

function generateComponentFiles(ctx: ComponentContext): Rule {
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

  return chain([createSource("./files", targetPath)]);
}

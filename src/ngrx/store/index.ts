import { join, normalize, strings } from "@angular-devkit/core";
import {
  apply,
  applyTemplates,
  chain,
  mergeWith,
  move,
  Rule,
  Tree,
  url,
} from "@angular-devkit/schematics";
import { getWorkspace } from "@schematics/angular/utility/workspace";
import { mergeFilesSmart } from "../../common/file-actions";
import { pluralizeEn, pluralizeEs } from "../../common/pluralize";
import { StoreSchemaOptions } from "./schema";

export function signalStore(options: StoreSchemaOptions): Rule {
  return async (tree: Tree) => {
    const workspace = await getWorkspace(tree);
    const globalConfig = (workspace.extensions as any).schematics?.[
      "@barcidev/ngx-autogen:all"
    ];
    if (globalConfig && globalConfig.pk && !options.pk) {
      options.pk = globalConfig.pk;
    }

    // En tu función signalStore
    // 1. Obtener la ruta absoluta del sistema donde se ejecuta el comando
    const fullPath = process.cwd();

    // 2. Buscar la posición de 'src' para limpiar la ruta
    const srcIndex = fullPath.lastIndexOf("src");

    let relativePath = "";
    if (srcIndex !== -1) {
      // Extraemos de 'src' en adelante (ej: src/app/features/billing)
      relativePath = fullPath.substring(srcIndex);
    } else {
      // Si no encuentra 'src' (estás en la raíz), usamos el path por defecto
      relativePath = join(normalize("src"), "app");
    }

    // 3. Normalizar y asegurar que termine en 'state'
    let movePath = normalize(relativePath);
    if (!movePath.endsWith("state")) {
      movePath = join(movePath, "state");
    }

    options.path = movePath;

    const indexPath = join(movePath, "index.ts");
    const nameDash = strings.dasherize(options.name);
    const entityName = strings.classify(options.name);

    const entityHeader = `/* ${entityName.toUpperCase()} */`;
    const exportBlock = [
      entityHeader,
      `export * from './${nameDash}${options.grouped ? "/models" : ""}/${nameDash}.model';`,
      `export * from './${nameDash}${options.grouped ? "/services" : ""}/${nameDash}.service';`,
      `export * from './${nameDash}/${nameDash}.store';`,
      "",
    ].join("\n");

    let content = "";

    if (tree.exists(indexPath)) {
      content = tree.read(indexPath)!.toString();
    }

    if (content.includes(entityHeader)) {
      const lines = exportBlock.split("\n");
      lines.forEach((line) => {
        if (line.trim() !== "" && !content.includes(line)) {
          content += line + "\n";
        }
      });
    } else {
      content =
        content.trim() + (content.length > 0 ? "\n\n" : "") + exportBlock;
    }

    if (tree.exists(indexPath)) {
      tree.overwrite(indexPath, content);
    } else {
      tree.create(indexPath, content);
    }

    // Generar archivos en las carpetas store, services y models
    const namePath = join(movePath, strings.dasherize(options.name));
    const rules = [];

    // store
    rules.push(
      mergeWith(
        apply(url("./files/state/store"), [
          applyTemplates({
            ...strings,
            ...options,
            pluralize: (word: string) => {
              switch (options.lang) {
                case "es":
                  return pluralizeEs(word);
                default:
                  return pluralizeEn(word);
              }
            },
            pk: options.pk || "id",
          }),
          move(namePath),
        ]),
      ),
    );

    // services
    rules.push(
      mergeWith(
        apply(url("./files/state/services"), [
          applyTemplates({
            ...strings,
            ...options,
            pluralize: (word: string) => {
              switch (options.lang) {
                case "es":
                  return pluralizeEs(word);
                default:
                  return pluralizeEn(word);
              }
            },
            pk: options.pk || "id",
          }),
          move(join(namePath, options.grouped ? "services" : "")),
        ]),
      ),
    );

    // models
    rules.push(
      mergeWith(
        apply(url("./files/state/models"), [
          applyTemplates({
            ...strings,
            ...options,
            pluralize: (word: string) => {
              switch (options.lang) {
                case "es":
                  return pluralizeEs(word);
                default:
                  return pluralizeEn(word);
              }
            },
            pk: options.pk || "id",
          }),
          move(join(namePath, options.grouped ? "models" : "")),
        ]),
      ),
    );

    // common entity
    rules.push(
      mergeFilesSmart("./files/entity", "src/app/shared/state", options, tree),
    );

    return chain(rules);
  };
}

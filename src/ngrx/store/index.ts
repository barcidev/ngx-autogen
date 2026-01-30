import { join, normalize, strings } from "@angular-devkit/core";
import {
  apply,
  applyTemplates,
  chain,
  forEach,
  mergeWith,
  move,
  Rule,
  Tree,
  url,
} from "@angular-devkit/schematics";
import { getWorkspace } from "@schematics/angular/utility/workspace";
import { StoreSchemaOptions } from "./schema";

const pluralizeEs = (name: string): string => {
  if (!name) return name;
  const lastChar = name.slice(-1).toLowerCase();
  const vowels = ["a", "e", "i", "o", "u"];
  if (vowels.includes(lastChar)) return name + "s";
  if (lastChar === "z") return name.slice(0, -1) + "ces";
  return name + "es";
};

const pluralizeEn = (name: string): string => {
  if (!name) return name;
  const lastChar = name.slice(-1).toLowerCase();
  const vowels = ["a", "e", "i", "o", "u"];
  if (lastChar === "y" && !vowels.includes(name.slice(-2, -1).toLowerCase())) {
    return name.slice(0, -1) + "ies";
  }
  if (
    ["s", "x", "z", "ch", "sh"].some((end) => name.toLowerCase().endsWith(end))
  ) {
    return name + "es";
  }
  return name + "s";
};

function mergeFilesSmart(
  urlPath: string,
  destPath: string,
  options: any,
  tree: Tree,
): Rule {
  return mergeWith(
    apply(url(urlPath), [
      applyTemplates({ ...strings, ...options }),
      move(destPath),
      forEach((fileEntry) => {
        if (tree.exists(fileEntry.path)) {
          const existingContent = tree.read(fileEntry.path)!.toString();
          if (existingContent.includes(fileEntry.content.toString().trim())) {
            return null;
          }
        }
        return fileEntry;
      }),
    ]),
  );
}

export function signalStore(options: StoreSchemaOptions): Rule {
  return async (tree: Tree) => {
    const workspace = await getWorkspace(tree);
    const globalConfig = (workspace.extensions as any).schematics?.[
      "ngx-autogen:all"
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

import { chain, Rule, Tree } from "@angular-devkit/schematics";
import { NgAddSchemaOptions } from "./schema";

const LIBRARY_NAME = "@barcidev/ngx-autogen";

export function ngAdd(options: NgAddSchemaOptions): Rule {
  return () => {
    return chain([cleanupPackageJson(), registerInAngularJson(options)]);
  };
}

/**
 * Regla: Mueve la lib a devDependencies
 */
function cleanupPackageJson(): Rule {
  return (tree: Tree) => {
    const content = tree.read("package.json")?.toString();
    if (!content) return tree;
    const json = JSON.parse(content);

    if (json.dependencies?.[LIBRARY_NAME]) {
      const ver = json.dependencies[LIBRARY_NAME];
      delete json.dependencies[LIBRARY_NAME];
      json.devDependencies = { ...json.devDependencies, [LIBRARY_NAME]: ver };
      tree.overwrite("package.json", JSON.stringify(json, null, 2));
    }
    return tree;
  };
}

/**
 * Regla: Configura la CLI de Angular
 */
function registerInAngularJson(options: NgAddSchemaOptions): Rule {
  return (tree: Tree) => {
    const buffer = tree.read("angular.json");
    if (!buffer) return tree;
    const workspace = JSON.parse(buffer.toString());

    workspace.cli = workspace.cli || {};
    const collections = workspace.cli.schematicCollections || [];

    if (!collections.includes(LIBRARY_NAME)) {
      collections.push(LIBRARY_NAME);
      workspace.cli.schematicCollections = collections;
      tree.overwrite("angular.json", JSON.stringify(workspace, null, 2));
    }

    if (!workspace.schematics) workspace.schematics = {};
    workspace.schematics["@barcidev/ngx-autogen:all"] = {
      lang: options.lang,
    };
    return tree;
  };
}

import {
  Rule,
  SchematicContext,
  SchematicsException,
  Tree,
} from "@angular-devkit/schematics";
import { NodePackageInstallTask } from "@angular-devkit/schematics/tasks";
import { NgAddSchemaOptions } from "./schema";

export function ngAdd(options: NgAddSchemaOptions): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    const packagePath = "/package.json";
    const buffer = tree.read(packagePath);

    if (!buffer) {
      throw new SchematicsException(
        "Could not find package.json. Make sure you are in the root of an Angular project.",
      );
    }

    const packageJson = JSON.parse(buffer.toString());

    const angularCoreVer =
      packageJson.dependencies["@angular/core"] ||
      packageJson.devDependencies["@angular/core"];

    if (!angularCoreVer) {
      throw new SchematicsException(
        "The version of @angular/core could not be determined. Please ensure that Angular is installed in your project.",
      );
    }

    const mainVersion = parseInt(
      angularCoreVer.replace(/[^\d.]/g, "").split(".")[0],
      10,
    );

    if (mainVersion < 20) {
      _context.logger.error(
        `❌ Error: @barcidev/ngx-autogen requires Angular v20 or higher. Detected: v${mainVersion}`,
      );
      return tree; // Stop execution
    }

    const ngrxVersion = `^${mainVersion}.0.0`;

    _context.logger.info(
      `📦 Configuring dependencies for Angular v${mainVersion}...`,
    );

    const packageName = "@barcidev/ngx-autogen";

    packageJson.dependencies = {
      ...packageJson.dependencies,
      "@ngrx/signals": ngrxVersion,
    };

    if (packageJson.dependencies[packageName]) {
      const currentVer = packageJson.dependencies[packageName];
      delete packageJson.dependencies[packageName];

      packageJson.devDependencies = {
        ...packageJson.devDependencies,
        [packageName]: currentVer,
      };
    }

    packageJson.dependencies = sortObjectKeys(packageJson.dependencies);
    packageJson.devDependencies = sortObjectKeys(packageJson.devDependencies);

    tree.overwrite(packagePath, JSON.stringify(packageJson, null, 2));

    updateAngularJson(tree, options);

    updateTsConfig(tree);

    _context.addTask(new NodePackageInstallTask());

    return tree;
  };
}

function sortObjectKeys(obj: any) {
  return Object.keys(obj)
    .sort()
    .reduce((result: any, key) => {
      result[key] = obj[key];
      return result;
    }, {});
}

function updateAngularJson(tree: Tree, options: NgAddSchemaOptions) {
  const path = "/angular.json";
  const buffer = tree.read(path);
  if (!buffer) return;

  const workspace = JSON.parse(buffer.toString());

  if (!workspace.cli) workspace.cli = {};
  const collections = workspace.cli.schematicCollections || [];
  if (!collections.includes("@barcidev/ngx-autogen")) {
    collections.push("@barcidev/ngx-autogen");
    workspace.cli.schematicCollections = collections;
  }

  if (!workspace.schematics) workspace.schematics = {};
  workspace.schematics["@barcidev/ngx-autogen:all"] = {
    pk: options.pk,
    lang: options.lang,
  };

  tree.overwrite(path, JSON.stringify(workspace, null, 2));
}

/**
 * Configura los Paths en el tsconfig.json para permitir el uso de @shared/*
 */
function updateTsConfig(tree: Tree) {
  const tsConfigPath = "/tsconfig.json";
  const path = tree.exists(tsConfigPath) ? tsConfigPath : "/tsconfig.app.json";

  const buffer = tree.read(path);
  if (!buffer) return;

  let contentText = buffer.toString();

  // Limpieza manual de comentarios para evitar que JSON.parse falle
  const cleanJson = contentText.replace(
    /\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm,
    "$1",
  );

  let tsconfig: any;
  try {
    tsconfig = JSON.parse(cleanJson);
  } catch (e) {
    // Si falla, intentamos parsearlo tal cual por si no tiene comentarios
    try {
      tsconfig = JSON.parse(contentText);
    } catch (innerError) {
      throw new SchematicsException(
        `No se pudo parsear ${path}. Asegúrate de que es un JSON válido.`,
      );
    }
  }

  // Configurar los paths
  tsconfig.compilerOptions = tsconfig.compilerOptions || {};
  tsconfig.compilerOptions.paths = tsconfig.compilerOptions.paths || {};

  const sharedAlias = "@shared-state/*";
  const sharedPath = ["src/app/shared/state/*"];

  if (!tsconfig.compilerOptions.paths[sharedAlias]) {
    tsconfig.compilerOptions.paths[sharedAlias] = sharedPath;
    tree.overwrite(path, JSON.stringify(tsconfig, null, 2));
  }
}

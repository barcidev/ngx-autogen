import { SchematicsException, Tree } from "@angular-devkit/schematics";

export const getProjectMetadata = (tree: Tree) => {
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
};

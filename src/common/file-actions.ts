import {
  apply,
  applyTemplates,
  forEach,
  mergeWith,
  move,
  Rule,
  strings,
  Tree,
  url,
} from "@angular-devkit/schematics";
import { InsertChange } from "@schematics/angular/utility/change";
import * as ts from "typescript";

import { SchematicsException } from "@angular-devkit/schematics";
import { insertImport } from "@schematics/angular/utility/ast-utils";

export const mergeFilesSmart = (
  urlPath: string,
  destPath: string,
  options: any,
  tree: Tree,
): Rule => {
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
};

/**
 * Añade un provider a un componente Standalone y gestiona sus imports.
 */
export function addMetadataToStandaloneComponent(
  componentPath: string,
  symbolName: string,
  importSources: { symbol: string; path: string }[],
  metadataField: "providers" | "imports" = "imports",
): Rule {
  return (tree: Tree) => {
    const text = tree.read(componentPath);
    if (!text)
      throw new SchematicsException(
        `No se encontró el archivo: ${componentPath}`,
      );

    const sourceText = text.toString("utf-8");
    const source = ts.createSourceFile(
      componentPath,
      sourceText,
      ts.ScriptTarget.Latest,
      true,
    );
    const recorder = tree.beginUpdate(componentPath);

    // 1. Gestionar Imports de TypeScript (Cabecera del archivo)
    importSources.forEach((item) => {
      const importChange = insertImport(
        source,
        componentPath,
        item.symbol,
        item.path,
      );
      if (importChange instanceof InsertChange) {
        recorder.insertLeft(importChange.pos, importChange.toAdd);
      }
    });

    // 2. Buscar la clase con el decorador @Component
    const componentClass = source.statements.find(
      (s): s is ts.ClassDeclaration =>
        ts.isClassDeclaration(s) &&
        !!ts
          .getDecorators(s)
          ?.some(
            (d) =>
              ts.isCallExpression(d.expression) &&
              ts.isIdentifier(d.expression.expression) &&
              d.expression.expression.text === "Component",
          ),
    );

    if (!componentClass) return tree;

    const decorator = ts
      .getDecorators(componentClass)!
      .find(
        (d) =>
          (d.expression as ts.CallExpression).expression.getText() ===
          "Component",
      );

    const callExpr = decorator!.expression as ts.CallExpression;
    const objectLiteral = callExpr.arguments[0] as ts.ObjectLiteralExpression;

    // 3. Buscar la propiedad específica (imports o providers)
    const targetProp = objectLiteral.properties.find(
      (p): p is ts.PropertyAssignment =>
        ts.isPropertyAssignment(p) &&
        ts.isIdentifier(p.name) &&
        p.name.text === metadataField,
    );

    if (targetProp && ts.isArrayLiteralExpression(targetProp.initializer)) {
      // CASO A: El array YA existe
      const elements = targetProp.initializer.elements;
      if (elements.length > 0) {
        const lastElement = elements[elements.length - 1];
        recorder.insertRight(lastElement.getEnd(), `, ${symbolName}`);
      } else {
        recorder.insertRight(targetProp.initializer.getStart() + 1, symbolName);
      }
    } else {
      // CASO B: La propiedad NO existe, la creamos al inicio del objeto
      const pos = objectLiteral.getStart() + 1;
      const toAdd = `\n  ${metadataField}: [${symbolName}],`;
      recorder.insertRight(pos, toAdd);
    }

    tree.commitUpdate(recorder);
    return tree;
  };
}

import {
  chain,
  externalSchematic,
  noop,
  Rule,
  schematic,
  strings,
  Tree,
} from "@angular-devkit/schematics";
import {
  getWorkspace,
  WorkspaceDefinition,
} from "@schematics/angular/utility/workspace";
import { join, normalize } from "path";
import { Project, QuoteKind, Scope, SyntaxKind } from "ts-morph";
import { askConfirm, askInput } from "../../common/prompts";
import { ComponentContext, ComponentSchemaOptions } from "./types/types";

export function component(options: ComponentSchemaOptions): Rule {
  return async (tree: Tree) => {
    const workspace = await getWorkspace(tree);

    if (options.store === "Yes") {
      if (!options.storeName) {
        options.storeName = await askInput(
          "What is the name of the entity store to create?",
          options.name,
        );
      }
      if (!options.pk) {
        options.pk = await askInput(
          "What is the name of the default Primary Key (e.g., id, cod, uuid)?",
          "id",
        );
      }
      if (options.isProvideInRoot === undefined) {
        options.isProvideInRoot = await askConfirm(
          "Should the store and service be provided in root?",
          false,
        );
      }
    }

    const context = resolveComponentContext(workspace, options);

    return chain([
      externalSchematic("@schematics/angular", "component", {
        name: context.options.name,
        path: context.movePath,
        project: context.projectName,
        style: options.style,
        skipTests: options.skipTests,
        inlineStyle: options.inlineStyle,
        inlineTemplate: options.inlineTemplate,
        standalone: true, // Forzar standalone true como estándar moderno
      }),
      injectStoreAndI18n(context),
      options.i18n === "Yes"
        ? schematic("app-i18n", {
            name: context.options.name,
            path: join(context.movePath, context.nameDash),
          })
        : noop(),
      options.store === "Yes"
        ? schematic("app-store", {
            name: options.storeName || context.options.name,
            path: join(context.movePath, context.nameDash),
            pk: context.options.pk,
            isProvideInRoot: context.options.isProvideInRoot,
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

function injectStoreAndI18n(ctx: ComponentContext): Rule {
  return (tree: Tree) => {
    const { options, movePath, nameDash } = ctx;
    const storeName = options.storeName ? strings.classify(options.storeName) : '';
    const storeVar = options.storeName ? strings.camelize(options.storeName) : '';
    const componentName = strings.classify(options.name);
    
    const tsPath = join(movePath, nameDash, `${nameDash}.component.ts`);
    const project = new Project({ manipulationSettings: { quoteKind: QuoteKind.Single } });

    if (options.store === 'Yes' && tree.exists(tsPath)) {
      const sourceFile = project.createSourceFile('temp.ts', tree.read(tsPath)!.toString());

      sourceFile.addImportDeclaration({
        moduleSpecifier: './state',
        namedImports: options.isProvideInRoot ? [`${storeName}Store`] : [`${storeName}Store`, `provide${storeName}Store`]
      });

      const hasJsonPipe = sourceFile.getImportDeclarations().some(imp => imp.getNamedImports().some(n => n.getName() === 'JsonPipe'));
      if (!hasJsonPipe) {
          sourceFile.addImportDeclaration({
              moduleSpecifier: '@angular/common',
              namedImports: ['JsonPipe']
          });
      }

      const hasInject = sourceFile.getImportDeclarations().some(imp => imp.getNamedImports().some(n => n.getName() === 'inject'));
      if (!hasInject) {
          const coreImport = sourceFile.getImportDeclaration('@angular/core');
          if (coreImport) {
              coreImport.addNamedImport('inject');
          } else {
              sourceFile.addImportDeclaration({
                  moduleSpecifier: '@angular/core',
                  namedImports: ['inject']
              });
          }
      }

      const classDecl = sourceFile.getClass(`${componentName}Component`);
      if (classDecl) {
        classDecl.insertProperty(0, {
          name: `_${storeVar}Store`,
          initializer: `inject(${storeName}Store)`,
          scope: Scope.Private
        });
        classDecl.insertProperty(1, {
          name: `data$`,
          initializer: `this._${storeVar}Store.entities()`
        });

        const componentDecorator = classDecl.getDecorator('Component');
        if (componentDecorator) {
          const objExpr = componentDecorator.getArguments()[0];
          if (objExpr && objExpr.getKind() === SyntaxKind.ObjectLiteralExpression) {
            const obj = objExpr.asKindOrThrow(SyntaxKind.ObjectLiteralExpression);
            
            const importsProp = obj.getProperty('imports');
            if (importsProp && importsProp.getKind() === SyntaxKind.PropertyAssignment) {
                const arr = importsProp.asKindOrThrow(SyntaxKind.PropertyAssignment).getInitializerIfKind(SyntaxKind.ArrayLiteralExpression);
                if (arr) {
                    arr.addElement('JsonPipe');
                }
            } else {
                obj.addPropertyAssignment({ name: 'imports', initializer: '[JsonPipe]' });
            }

            if (!options.isProvideInRoot) {
              const providersProp = obj.getProperty('providers');
              if (providersProp && providersProp.getKind() === SyntaxKind.PropertyAssignment) {
                  const arr = providersProp.asKindOrThrow(SyntaxKind.PropertyAssignment).getInitializerIfKind(SyntaxKind.ArrayLiteralExpression);
                  if (arr) {
                      arr.addElement(`...provide${storeName}Store()`);
                  }
              } else {
                  obj.addPropertyAssignment({ name: 'providers', initializer: `[...provide${storeName}Store()]` });
              }
            }
          }
        }
      }

      tree.overwrite(tsPath, sourceFile.getFullText());
    }

    if (!options.inlineTemplate) {
      const htmlPath = join(movePath, nameDash, `${nameDash}.component.html`);
      if (tree.exists(htmlPath)) {
          let htmlContent = `<div>\n  <h1>${componentName} Works!</h1>\n`;
          if (options.store === 'Yes') {
              htmlContent += `  <pre>{{ data$() | json }}</pre>\n`;
          }
          htmlContent += `</div>`;
          
          if (options.i18n === 'Yes') {
              htmlContent = `<div *typedTransloco="let t; prefix:'${strings.camelize(options.name)}'">\n  <h1>{{ t('title') }}</h1>\n`;
              if (options.store === 'Yes') {
                  htmlContent += `  <pre>{{ data$() | json }}</pre>\n`;
              }
              htmlContent += `</div>`;
          }
          tree.overwrite(htmlPath, htmlContent);
      }
    }

    const specPath = join(movePath, nameDash, `${nameDash}.component.spec.ts`);
    if (options.store === 'Yes' && !options.skipTests && tree.exists(specPath)) {
        const specSource = project.createSourceFile('spec.ts', tree.read(specPath)!.toString());
        specSource.addImportDeclaration({
          moduleSpecifier: './state',
          namedImports: [`${storeName}Store`]
        });

        const callExprs = specSource.getDescendantsOfKind(SyntaxKind.CallExpression);
        const configTestBed = callExprs.find(c => c.getExpression().getText() === 'TestBed.configureTestingModule');
        if (configTestBed) {
            const objArg = configTestBed.getArguments()[0];
            if (objArg && objArg.getKind() === SyntaxKind.ObjectLiteralExpression) {
                const obj = objArg.asKindOrThrow(SyntaxKind.ObjectLiteralExpression);
                const providersProp = obj.getProperty('providers');
                if (providersProp && providersProp.getKind() === SyntaxKind.PropertyAssignment) {
                    const arr = providersProp.asKindOrThrow(SyntaxKind.PropertyAssignment).getInitializerIfKind(SyntaxKind.ArrayLiteralExpression);
                    if (arr) {
                        arr.addElement(`{ provide: ${storeName}Store, useValue: { entities: () => [] } }`);
                    }
                } else {
                    obj.addPropertyAssignment({ name: 'providers', initializer: `[{ provide: ${storeName}Store, useValue: { entities: () => [] } }]` });
                }
            }
        }
        tree.overwrite(specPath, specSource.getFullText());
    }

    return tree;
  }
}

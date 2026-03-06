import { Rule, Tree } from "@angular-devkit/schematics";
export declare const mergeFilesSmart: (urlPath: string, destPath: string, options: any, tree: Tree) => Rule;
/**
 * Añade un provider a un componente Standalone y gestiona sus imports.
 */
export declare function addMetadataToStandaloneComponent(componentPath: string, symbolName: string, importSources: {
    symbol: string;
    path: string;
}[], metadataField?: "providers" | "imports"): Rule;

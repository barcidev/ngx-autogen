export interface ComponentContext {
    options: ComponentSchemaOptions;
    projectName: string;
    movePath: string;
    nameDash: string;
    entityName: string;
}
export interface ComponentSchemaOptions {
    name: string;
    project?: string;
    store: "Yes" | "No";
    i18n: "Yes" | "No";
    path?: string;
    lang?: "en" | "es";
}

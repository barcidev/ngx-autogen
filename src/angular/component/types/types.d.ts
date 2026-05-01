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
    storeName?: string;
    i18n: "Yes" | "No";
    pk?: string;
    isProvideInRoot?: boolean;
    path?: string;
    lang?: "en" | "es";
}

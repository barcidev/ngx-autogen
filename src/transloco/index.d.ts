import { Rule } from "@angular-devkit/schematics";
import { ProjectDefinition } from "@schematics/angular/utility/workspace";
import { TranslocoSchemaOptions } from "./types/types";
export declare function transloco(options: TranslocoSchemaOptions): Rule;
/**
 * --- REGLAS FUNCIONALES ---
 */
/**
 * Verifica si se requiere el setup global y lo ejecuta.
 * Esto evita el Overlapping edit al no leer archivos antes de tiempo.
 */
export declare function ensureExternalConfig(project: ProjectDefinition): Rule;

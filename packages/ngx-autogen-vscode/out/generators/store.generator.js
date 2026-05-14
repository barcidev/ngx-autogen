"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateStore = generateStore;
const path = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
const file_utils_1 = require("../utils/file.utils");
const install_utils_1 = require("../utils/install.utils");
const string_utils_1 = require("../utils/string.utils");
async function generateStore(targetPath, options) {
    const { entityName: name, useGroupedLayout: grouped, primaryKey: pk, provideInRoot: isProvideInRoot, defaultLang: lang } = options;
    const nameDash = (0, string_utils_1.dasherize)(name);
    const nameClass = (0, string_utils_1.classify)(name);
    const nameCamel = (0, string_utils_1.camelize)(name);
    const pluralName = (0, string_utils_1.pluralize)(name, lang);
    const pluralClass = (0, string_utils_1.classify)(pluralName);
    const pluralCamel = (0, string_utils_1.camelize)(pluralName);
    const stateDir = path.join(targetPath, 'state');
    const entityDir = path.join(stateDir, nameDash);
    const modelsDir = grouped ? path.join(entityDir, 'models') : entityDir;
    const servicesDir = grouped ? path.join(entityDir, 'services') : entityDir;
    (0, file_utils_1.ensureDir)(stateDir);
    (0, file_utils_1.ensureDir)(entityDir);
    (0, file_utils_1.ensureDir)(modelsDir);
    (0, file_utils_1.ensureDir)(servicesDir);
    const modelPath = path.join(modelsDir, `${nameDash}.model.ts`);
    const servicePath = path.join(servicesDir, `${nameDash}.service.ts`);
    const storePath = path.join(entityDir, `${nameDash}.store.ts`);
    const barrelPath = path.join(stateDir, 'index.ts');
    // MODEL TEMPLATE
    const modelContent = `import { FormGroupType } from '@barcidev/ngx-autogen/entity';

export interface Add${nameClass} {
}

export type Add${nameClass}Form = FormGroupType<Add${nameClass}>;

export interface ${nameClass}Dto {
  ${pk}: number;
}

export type Update${nameClass} = Partial<${nameClass}Dto> & Pick<${nameClass}Dto, '${pk}'>;

export interface ${nameClass}Request{}
`;
    // SERVICE TEMPLATE
    const serviceContent = `import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import {
  Add${nameClass},
  ${nameClass}Dto,
  Update${nameClass}
} from '${grouped ? "../models/" + nameDash + ".model" : "./" + nameDash + ".model"}';

@Injectable(${isProvideInRoot ? "{ providedIn: 'root' }" : ""})
export class ${nameClass}Service {

  add${nameClass}$(payload: Add${nameClass}): Observable<number> {
    return of(0);
  }

  remove${nameClass}$(${pk}: number): Observable<boolean> {
    return of(true);
  }

  get${pluralClass}$(): Observable<${nameClass}Dto[]> {
    return of([]);
  }

  update${nameClass}$(payload: Update${nameClass}): Observable<boolean> {
    return of(true);
  }
}
`;
    // STORE TEMPLATE
    const storeContent = `import { computed, inject } from '@angular/core';
import { patchState, signalStore, type, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';
import {
  addEntity,
  entityConfig,
  removeEntity,
  setAllEntities,
  updateEntity,
  withEntities
} from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, EMPTY, pipe, switchMap, tap } from 'rxjs';
import { EntityId } from '@ngrx/signals/entities';

import { RequestConfig, withEntityStatus, withPagination } from '@barcidev/ngx-autogen/entity';
import {
  Add${nameClass},
  ${nameClass}Dto,
  Update${nameClass}
} from '${grouped ? "./models/" + nameDash + ".model" : "./" + nameDash + ".model"}';
import { ${nameClass}Service } from '${grouped ? "./services/" + nameDash + ".service" : "./" + nameDash + ".service"}';

const config = entityConfig({
  entity: type<${nameClass}Dto>(),
  selectId: (entity) => entity.${pk},
});

export const ${nameClass}Store = signalStore(
  ${isProvideInRoot ? "{ providedIn: 'root' }," : ""}
  withEntities(config),
  withEntityStatus(),
  withPagination(),
  withComputed(({ entityMap, status: { idSelected } }) => ({
    ${nameCamel}Seleccionado: computed(() => {
      const id = idSelected();
      return id ? entityMap()[id] : null;
    })
  })),
  withMethods((store, ${nameCamel}Service = inject(${nameClass}Service)) => ({
    add${nameClass}: rxMethod<RequestConfig<Add${nameClass}, ${nameClass}Dto>>(
      pipe(
        tap(() => {
          patchState(store, (state) => ({ status: { ...state.status, addLoading: true } }));
        }),
        switchMap(({ onError, onSuccess, payload }) => {
          return ${nameCamel}Service.add${nameClass}$(payload).pipe(
            tap((id) => {
              const new${nameClass}: ${nameClass}Dto = { ...payload, [config.selectId({} as ${nameClass}Dto)]: id } as any;
              // Note: the above line is a bit hacky because we don't know the exact PK property name easily in the template context without more logic
              // but following the original template's spirit:
              (new${nameClass} as any).${pk} = id;

              patchState(store, addEntity(new${nameClass}, config), (state) => ({
                    ...state,
                    status: { ...state.status, addError: null, addLoading: false }
                  }));
              if (onSuccess) {
                onSuccess(new${nameClass});
              }
            }),
            catchError((error) => {
              patchState(store, (state) => ({
                status: { ...state.status, addError: error, addLoading: false }
              }));
              if (onError) {
                onError();
              }
              return EMPTY;
            })
          );
        })
      )
    ),
    load${pluralClass}: rxMethod<void>(
      pipe(
        tap(() => {
          patchState(store, (state) => ({ status: { ...state.status, loading: true } }));
        }),
        switchMap(() => {
          return ${nameCamel}Service.get${pluralClass}$().pipe(
            tap((response) => {
              patchState(store, setAllEntities(response, config), (state) => ({
                status: { ...state.status, error: null, loaded: true, loading: false }
              }));
            }),
            catchError((error) => {
              patchState(store, (state) => ({
                status: { ...state.status, error, loading: false }
              }));
              return EMPTY;
            })
          );
        })
      )
    ),
    remove${nameClass}: rxMethod<RequestConfig<number, boolean>>(
      pipe(
        tap(({ payload }) => {
          patchState(store, (state) => ({
            status: {
              ...state.status,
              _removeLoading: true,
              idsRemoving: [...(state.status.idsRemoving || []), payload]
            }
          }));
        }),
        switchMap(({ onError, onSuccess, payload }) => {
          return ${nameCamel}Service.remove${nameClass}$(payload).pipe(
            tap((response) => {
              if (response) {
                const idsRemoving = store.status.idsRemoving() || [];
                patchState(store, removeEntity(payload), (state) => ({
                  status: {
                    ...state.status,
                    _removeLoading: false,
                    error: null,
                    idsRemoving: idsRemoving.filter((idRemoving) => idRemoving !== payload)
                  }
                }));
                if (onSuccess) {
                  onSuccess(response);
                }
              } else {
                throw new Error();
              }
            }),
            catchError((error) => {
              const idsRemoving = store.status.idsRemoving() || [];
              patchState(store, (state) => ({
                status: {
                  ...state.status,
                  _removeLoading: false,
                  error,
                  idsRemoving: idsRemoving.filter((idRemoving) => idRemoving !== payload)
                }
              }));
              if (onError) {
                onError();
              }
              return EMPTY;
            })
          );
        })
      )
    ),
    select${nameClass}: rxMethod<EntityId | null>(
      pipe(
        tap((payload) => {
          patchState(store, (state) => ({
            status: {
              ...state.status,
              idSelected: payload
            }
          }));
        })
      )
    ),
    update${nameClass}: rxMethod<RequestConfig<Update${nameClass}, boolean>>(
      pipe(
        tap(({ payload }) => {
          patchState(store, (state) => ({
            status: {
              ...state.status,
              _updateLoading: true,
              idsUpdating: [...(state.status.idsUpdating || []), payload.${pk}]
            }
          }));
        }),
        switchMap(({ onError, onSuccess, payload }) => {
          return ${nameCamel}Service.update${nameClass}$(payload).pipe(
            tap((response) => {
              if (response) {
                const idsUpdating = store.status.idsUpdating() || [];
                patchState(store, updateEntity({ changes: payload, id: payload.${pk} }, config), (state) => ({
                  status: {
                    ...state.status,
                    _updateLoading: false,
                    error: null,
                    idsUpdating: idsUpdating.filter((idUpdating) => idUpdating !== payload.${pk})
                  }
                }));
                if (onSuccess) {
                  onSuccess(response);
                }
              } else {
                throw new Error('');
              }
            }),
            catchError((error) => {
              const idsUpdating = store.status.idsUpdating() || [];
              patchState(store, (state) => ({
                status: {
                  ...state.status,
                  _updateLoading: false,
                  error,
                  idsUpdating: idsUpdating.filter((idUpdating) => idUpdating !== payload.${pk})
                }
              }));
              if (onError) {
                onError();
              }
              return EMPTY;
            })
          );
        })
      )
    ),
  })),
  withHooks({
    onInit: (store) => {
      store.load${pluralClass}();
    },
  })
);

export function provide${nameClass}Store() {
  return [
    ${!isProvideInRoot ? `${nameClass}Service,` : ''}
    ${nameClass}Store,
  ];
}
`;
    (0, file_utils_1.writeFileIfNotExists)(modelPath, modelContent);
    (0, file_utils_1.writeFileIfNotExists)(servicePath, serviceContent);
    (0, file_utils_1.writeFileIfNotExists)(storePath, storeContent);
    const modelExport = grouped ? `./${nameDash}/models/${nameDash}.model` : `./${nameDash}/${nameDash}.model`;
    const serviceExport = grouped ? `./${nameDash}/services/${nameDash}.service` : `./${nameDash}/${nameDash}.service`;
    const storeExport = `./${nameDash}/${nameDash}.store`;
    (0, file_utils_1.appendToBarrel)(barrelPath, `export * from '${modelExport}';`);
    (0, file_utils_1.appendToBarrel)(barrelPath, `export * from '${serviceExport}';`);
    (0, file_utils_1.appendToBarrel)(barrelPath, `export * from '${storeExport}';`);
    if (!options.skipInstallPrompt) {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(targetPath))?.uri.fsPath || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (workspaceFolder) {
            await (0, install_utils_1.promptToInstallLibraries)(workspaceFolder, {
                dev: ['@barcidev/ngx-autogen'],
                regular: ['@ngrx/signals', '@ngrx/operators']
            });
        }
    }
    vscode.window.showInformationMessage(`✅ Store '${name}' generated successfully.`);
}
//# sourceMappingURL=store.generator.js.map
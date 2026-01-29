# ngx-autogen

[![Language: English](https://img.shields.io/badge/lang-en-blue.svg)](README.md)
[![Language: Spanish](https://img.shields.io/badge/lang-es-yellow.svg)](README.es.md)

**ngx-autogen** es un conjunto de schematics diseñados para optimizar y estandarizar el flujo de trabajo en proyectos Angular. Esta librería proporciona herramientas de generación de código que siguen las mejores prácticas, permitiendo a los desarrolladores ahorrar tiempo en tareas repetitivas y configuración de arquitectura.

## 🚀 Características

El proyecto se lanza inicialmente con un enfoque en la gestión de estado, pero está diseñado para crecer:

- **Store Schematic**: Nuestro primer schematic disponible. Permite generar automáticamente toda la estructura necesaria para un store basado en signals (NGRX-Signals), facilitando la integración rápida y escalable de la gestión de estado en tus aplicaciones.

## 📅 Próximamente

**ngx-autogen** es un proyecto en evolución continua. Se irán agregando progresivamente nuevas herramientas y schematics para cubrir más aspectos del desarrollo en Angular, como:

- Generación de servicios y utilidades.
- Scaffolding para componentes avanzados.

## 📦 Instalación

Puedes instalar el paquete en tu proyecto Angular mediante angular cli para que se configure automáticamente el proyecto con las dependencias necesarias:

```bash
ng add ngx-autogen
```

## 🛠️ Uso

### Generar un Store

#### Propiedades

- `name`(obligatorio): nombre del store.
- `pk`(opcional): nombre de la primary key, si no se especifica se usara la especificada en el proceso de instalacion del schematic, de lo contrario se usara `id`.
- `path`(opcional): ruta del store, si no se especifica se usara la especificada en el proceso de instalacion del schematic, de lo contrario se usara `src/app/core`. La carpeta `state` se agregará automáticamente a la ruta.
- `grouped` (opcional): si es verdadero, los archivos se agruparán en subcarpetas `models`, `services` y `store`.

#### Ejemplo

```bash
ng g app-store --name="user" --pk="cod"
```

Esto creará los archivos `user.model.ts`, `user.service.ts`, `user.store.ts` dentro de la carpeta `src/app/core/state/user`, y los archivos `entity.model.ts`, `with-entity-pagination.ts`, y `with-entity-status.ts` si no existen dentro de la carpeta `src/app/shared/state`.

```bash
src/
└── app/
    └── shared/
        └── state/
            ├── entity.model.ts
            ├── with-entity-pagination.ts
            └── with-entity-status.ts
    └── state/
        └── index.ts
        └── user/
            ├── user.service.ts
            ├── user.model.ts
            └── user.store.ts
```

El archivo `index.ts` exportará todo lo necesario para que el store pueda ser importado y utilizado en cualquier parte de la aplicación.

```typescript
/* USER */
export * from './user/user.model';
export * from './user/user.service';
export * from './user/user.store';
```

La carpeta `src/app/shared/state` contiene los archivos compartidos para el manejo del estado.

`entity.model.ts`:

```typescript
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl } from '@angular/forms';

export type FormGroupType<T> = {
  [K in keyof T]: FormControl<T[K]>;
};

export interface RequestConfig<T, U = unknown> {
  onError?: (error?: HttpErrorResponse) => void;
  onSuccess?: (response?: U) => void;
  payload: T;
}
```

El archivo `user.model.ts` contiene la interface del modelo de datos.

```typescript
import { FormGroupType } from 'src/app/shared/state/entity.model';

export interface AddUser {
}

export type AddUserForm = FormGroupType<AddUser>;

export interface UserDto {
  cod: number;
}

export type UpdateUser = Partial<UserDto> & Pick<UserDto, 'cod'>;

export interface UserRequest{}
```

El archivo `user.service.ts` contiene el servicio que se encarga de la lógica de negocio.

```typescript
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import {
  AddUser,
  UserDto,
  UpdateUser
} from './user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  addUser$(entity: AddUser): Observable<number> {
    return of(0);
  }

  removeUser$(cod: number): Observable<boolean> {
    return of(true);
  }

  getUsers$(): Observable<UserDto[]> {
    return of([]);
  }

  updateUser$(entity: UpdateUser): Observable<boolean> {
    return of(true);
  }
}
```

El archivo `user.store.ts` contiene el store que se encarga de la gestión de estado.

```typescript
import { computed, inject } from '@angular/core';
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
import { catchError, of, pipe, switchMap, tap } from 'rxjs';

import { RequestConfig } from 'src/app/shared/state/entity.model';
import { withPagination } from 'src/app/shared/state/with-entity-pagination';
import { withEntityStatus } from 'src/app/shared/state/with-entity-status';
import {
  AddUser,
  UserDto,
  UpdateUser
} from './user.model';
import { UserService } from './user.service';

const config = entityConfig({
  entity: type<UserDto>(),
  selectId: (entity) => entity.cod,
});

export const UserStore = signalStore(
  withEntities(config),
  withEntityStatus(),
  withPagination(),
  withComputed(({ entities, entityMap, status: { idSelected } }) => ({
    users: computed(() => entities()),
    userSeleccionado: computed(() => {
      const cod = idSelected();
      return cod ? entityMap()[cod] : null;
    })
  })),
  withMethods((store, userService = inject(UserService)) => ({
    addUser: rxMethod<RequestConfig<AddUser, UserDto>>(
      pipe(
        tap(() => {
          patchState(store, (state) => ({ status: { ...state.status, addLoading: true } }));
        }),
        switchMap(({ onError, onSuccess, payload: { request } }) => {
          return userService.addUser$(request).pipe(
            tap((cod) => {
              const newUser: UserDto = { ...request, cod};
              patchState(store, addEntity(newUser, config), (state) => ({
                    ...state,
                    status: { ...state.status, addError: null, addLoading: false }
                  }));
              if (onSuccess) {
                onSuccess(newUser);
              }
            }),
            catchError(() => {
              const error = new Error('');
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
    loadUsers: rxMethod<void>(
      pipe(
        tap(() => {
          patchState(store, (state) => ({ status: { ...state.status, loading: true } }));
        }),
        switchMap(() => {
          return userService.getUsers$().pipe(
            tap((response) => {
              patchState(store, setAllEntities(response, config), (state) => ({
                status: { ...state.status, error: null, loaded: true, loading: false }
              }));
            }),
            catchError(() => {
              patchState(store, (state) => ({
                status: { ...state.status, error: new Error('Error al cargar users'), loading: false }
              }));
              return EMPTY;
            })
          );
        })
      )
    ),
    removeUser: rxMethod<RequestConfig<number, boolean>>(
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
          return userService.removeUser$(payload).pipe(
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
            catchError(() => {
              const idsRemoving = store.status.idsRemoving() || [];
              patchState(store, (state) => ({
                status: {
                  ...state.status,
                  _removeLoading: false,
                  error: new Error(),
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
    updateUser: rxMethod<RequestConfig<UpdateUser, boolean>>(
      pipe(
        tap(({ payload }) => {
          patchState(store, (state) => ({
            status: {
              ...state.status,
              _updateLoading: true,
              idsUpdating: [...(state.status.idsUpdating || []), payload.cod]
            }
          }));
        }),
        switchMap(({ onError, onSuccess, payload }) => {
          return userService.updateUser$(entity).pipe(
            tap((response) => {
              if (response) {
                const idsUpdating = store.status.idsUpdating() || [];
                patchState(store, updateEntity({ changes: payload, id: payload.cod }, config), (state) => ({
                  status: {
                    ...state.status,
                    _updateLoading: false,
                    error: null,
                    idsUpdating: idsUpdating.filter((idUpdating) => idUpdating !== payload.cod)
                  }
                }));
                if (onSuccess) {
                  onSuccess(response);
                }
              } else {
                throw new Error('');
              }
            }),
            catchError(() => {
              const idsUpdating = store.status.idsUpdating() || [];
              patchState(store, (state) => ({
                status: {
                  ...state.status,
                  _updateLoading: false,
                  error: new Error('Error al actualizar user'),
                  idsUpdating: idsUpdating.filter((idUpdating) => idUpdating !== payload.cod)
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
      store.loadUsers();
    },
  })
);
```

## 📄 Licencia

Este proyecto está bajo la licencia [MIT](LICENSE).

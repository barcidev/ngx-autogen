# ngx-autogen

[![Language: English](https://img.shields.io/badge/lang-en-blue.svg)](README.md)
[![Language: Spanish](https://img.shields.io/badge/lang-es-yellow.svg)](README.es.md)

**ngx-autogen** is a set of schematics designed to optimize and standardize the workflow in Angular projects. This library provides code generation tools that follow best practices, allowing developers to save time on repetitive tasks and architecture configuration.

## 🚀 Features

The project is initially launched with a focus on state management, but is designed to grow:

- **Store Schematic**: Our first available schematic. It allows you to automatically generate the entire structure needed for a store based on signals (NGRX-Signals), facilitating the quick and scalable integration of state management in your applications.

## 📅 Coming Soon

**ngx-autogen** is a project in continuous evolution. New tools and schematics will be progressively added to cover more aspects of Angular development, such as:

- Generation of services and utilities.
- Scaffolding for advanced components.

## 📦 Installation

You can install the package in your Angular project using Angular CLI so that the project is automatically configured with the necessary dependencies:

```bash
ng add ngx-autogen
```

## 🛠️ Usage

### Generate a Store

#### Properties

- `name` (required): name of the store.
- `pk` (optional): name of the primary key. If not specified, the one specified during the schematic installation process will be used; otherwise, `id` will be used.
- `path` (optional): path of the store. If not specified, the one specified during the schematic installation process will be used; otherwise, `src/app/core` will be used. The folder `state` will be automatically appended to the path.
- `grouped` (optional): if true, the files will be grouped into subfolders `models`, `services`, and `store`.

#### Example

```bash
ng g app-store --name="user" --pk="cod"
```

This will create the files `user.model.ts`, `user.service.ts`, `user.store.ts` within the `src/app/core/state/user` folder, and the files `entity.model.ts`, `with-entity-pagination.ts`, and `with-entity-status.ts` if they don't exist within the `src/app/shared/state` folder.

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

The `index.ts` file will export everything necessary so that the store can be imported and used anywhere in the application.

```typescript
/* USER */
export * from './user/user.model';
export * from './user/user.service';
export * from './user/user.store';
```

The `src/app/shared/state` folder contains the shared files for state management.

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

The `user.model.ts` file contains the data model interface.

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

The `user.service.ts` file contains the service responsible for business logic.

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

The `user.store.ts` file contains the store responsible for state management.

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

## 📄 License

This project is under the [MIT](LICENSE) license.

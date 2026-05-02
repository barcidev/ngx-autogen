<p align="center">
  <h1 align="center">@barcidev/ngx-autogen</h1>
</p>

<p align="center">
  <a href="README.md">English</a> | <a href="README_ES.md">Español</a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@barcidev/ngx-autogen"><img src="https://img.shields.io/npm/v/@barcidev/ngx-autogen" alt="npm version"></a>
  <a href="https://github.com/jpalacio09/ngx-autogen/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@barcidev/ngx-autogen" alt="license"></a>
  <img src="https://img.shields.io/badge/Angular-17%2B-DD0031?logo=angular" alt="Angular 17+">
  <img src="https://img.shields.io/badge/NgRx%20Signals-17%2B-BA2BD2?logo=ngrx" alt="NgRx Signals 17+">
</p>

<p align="center">
  Angular schematics that scaffold complete NgRx Signal Store entities, Transloco i18n scopes, and standalone components in seconds.
</p>

---

## Table of Contents

- [Overview](#overview)
- [Requirements](#requirements)
- [Installation](#installation)
  - [Via ng add (recommended)](#via-ng-add-recommended)
  - [Via npm](#via-npm)
- [Runtime Exports](#runtime-exports)
- [Schematics Reference](#schematics-reference)
  - [ng-add](#ng-add)
  - [app-store](#app-store)
  - [app-i18n](#app-i18n)
  - [app-component](#app-component)
- [License](#license)

---

## Overview

`@barcidev/ngx-autogen` is a collection of Angular schematics designed to eliminate repetitive scaffolding when building enterprise Angular applications. It generates production-ready code for three core concerns:

- **NgRx Signal Store** (`app-store`) - Full CRUD signal store with entity management, pagination state, status tracking, and an accompanying service and model layer. Built on `@ngrx/signals` and `@ngrx/signals/entities`.
- **Transloco i18n** (`app-i18n`) - Scoped translation files with typed Transloco integration via `@barcidev/typed-transloco`, automatic provider registration, and global type map updates.
- **Angular Component** (`app-component`) - Standalone component generation via `@schematics/angular` with optional automatic store and i18n wiring.

The library also ships runtime utilities under `@barcidev/ngx-autogen/entity` that provide reusable NgRx Signal Store features: `withEntityStatus`, `withPagination`, and typed model helpers.

---

## Requirements

| Dependency | Minimum Version |
|---|---|
| `@angular/core` | `>=17.0.0` |
| `@angular/common` | `>=17.0.0` |
| `@angular/forms` | `>=17.0.0` |
| `@ngrx/signals` | `>=17.0.0` |
| Node.js | `>=16.0.0` |

---

## Installation

### Via ng add (recommended)

```bash
ng add @barcidev/ngx-autogen
```

This command performs the following actions automatically:

1. **Moves the library to `devDependencies`** - If installed as a production dependency, it is relocated to `devDependencies` in `package.json`.
2. **Registers the schematic collection** - Adds `@barcidev/ngx-autogen` to `cli.schematicCollections` in `angular.json`, enabling short-form aliases like `ng g app-store`.
3. **Stores global configuration** - Saves the selected default language (`lang`) under `schematics["@barcidev/ngx-autogen:all"]` in `angular.json` so all schematics inherit it.

**Prompt:**

| Prompt | Default |
|---|---|
| What is the default language for the application (en, es)? | `en` |

### Via npm

```bash
npm install @barcidev/ngx-autogen --save-dev
```

> [!NOTE]
> When installing via npm, you must manually register the collection in `angular.json` and use the fully qualified schematic name (e.g., `ng generate @barcidev/ngx-autogen:app-store`).

---

## Runtime Exports

The library exports reusable NgRx Signal Store features under the `@barcidev/ngx-autogen/entity` entry point:

| Export | Description |
|---|---|
| `withEntityStatus()` | Signal Store feature that adds loading, error, and selection state tracking for entities. |
| `withPagination()` | Signal Store feature that adds pagination state (page, size, total). |
| `RequestConfig<TPayload, TResponse>` | Generic type for store method configurations with `payload`, `onSuccess`, and `onError` callbacks. |
| `FormGroupType<T>` | Utility type that maps an interface to its Angular `FormGroup` control types. |

```typescript
import { withEntityStatus, withPagination, RequestConfig, FormGroupType } from '@barcidev/ngx-autogen/entity';
```

---

## Schematics Reference

### `ng-add`

**Description**: Ng add schematic for ngx-autogen. Configures the workspace for using all library schematics.

**Usage**
```bash
ng add @barcidev/ngx-autogen
```

**Options**

| Option | Type | Default | Required | Description |
|---|---|---|---|---|
| `lang` | `string` | `en` | No | The default language for the application (`en`, `es`). |

---

### `app-store`

> Alias: `ng g app-store` (when collection is registered via `ng add`)

**Description**: Adds NgRx Store to the Angular application with signal support. Generates a complete CRUD signal store, service, and model layer for a given entity.

**Usage**
```bash
# Short form (requires ng add):
ng g app-store --name product

# Full form:
ng generate @barcidev/ngx-autogen:app-store --name product
```

**Options**

| Option | Type | Default | Required | Description |
|---|---|---|---|---|
| `name` | `string` | - | **Yes** | Name of the entity. Used to derive all class names, file names, and store methods. |
| `path` | `string` | *(cwd)* | No | Destination path. Defaults to the current working directory relative to `src/`. |
| `grouped` | `boolean` | `false` | No | Whether the files should be grouped in `models/` and `services/` subfolders. |
| `pk` | `string` | `id` | No | The name of the default Primary Key (e.g., `id`, `cod`, `uuid`). |
| `lang` | `string` | *(global)* | No | The default language for the application (`en`, `es`). Inherited from `ng add` config. |
| `isProvideInRoot` | `boolean` | `false` | No | Whether the store and service should use `providedIn: 'root'`. |

**What it generates**

For a given entity name, this schematic creates:

- `<name>.store.ts` - NgRx Signal Store with full CRUD methods (`add`, `load`, `update`, `remove`, `select`), entity config, computed selectors, and `onInit` hook.
- `<name>.service.ts` - Injectable service with stub methods for `add$`, `get$` (pluralized), `update$`, and `remove$`.
- `<name>.model.ts` - TypeScript interfaces: `Add<Name>`, `<Name>Dto`, `Update<Name>`, `Add<Name>Form`, and `<Name>Request`.
- `state/index.ts` - Barrel file with re-exports (created or updated).

It also:
- Installs `@ngrx/signals` if not already present (matching Angular major version).
- Configures `@shared-state/*` path alias in `tsconfig.app.json`.
- Saves `pk` and `lang` defaults in `angular.json`.

**Examples**

**Minimal - Entity with defaults:**
```bash
ng g app-store --name product
```
```
src/app/state/
  index.ts
  product/
    product.model.ts
    product.service.ts
    product.store.ts
```

**Grouped layout with custom PK:**
```bash
ng g app-store --name invoice --grouped --pk cod
```
```
src/app/state/
  index.ts
  invoice/
    models/
      invoice.model.ts
    services/
      invoice.service.ts
    invoice.store.ts
```

**Provided in root with Spanish pluralization:**
```bash
ng g app-store --name usuario --isProvideInRoot --lang es
```
```
src/app/state/
  index.ts
  usuario/
    usuario.model.ts      # interfaces with pk: id
    usuario.service.ts    # @Injectable({ providedIn: 'root' })
    usuario.store.ts      # signalStore({ providedIn: 'root' }, ...) - methods use "Usuarios" (Spanish plural)
```

---

### `app-i18n`

> Alias: `ng g app-i18n` (when collection is registered via `ng add`)

**Description**: Adds Transloco to the Angular application. Generates a scoped i18n translation file and wires it into the target component.

**Usage**
```bash
# Short form:
ng g app-i18n --name dashboard

# Full form:
ng generate @barcidev/ngx-autogen:app-i18n --name dashboard
```

**Options**

| Option | Type | Default | Required | Description |
|---|---|---|---|---|
| `name` | `string` | *(auto-detected)* | No | Name of the component. Auto-detected from the `.component.ts` file in the current directory if not provided. |
| `path` | `string` | *(cwd)* | No | Destination path. Defaults to the current working directory relative to `src/`. |
| `lang` | `string` | *(global)* | No | Language for pluralization (`en` for English, `es` for Spanish). |

**What it generates**

- `<name>.i18n.ts` - Translation scope file with `en-US` and `es-CO` objects registered via `TranslocoUtils.createScopeConfig`.

It also:
- Runs `@barcidev/typed-transloco:ng-add` if Transloco is not yet configured in the project.
- Adds `provideTranslocoScopeWrapper` to the component's `providers` array.
- Adds `AppTypedTranslocoDirective` to the component's `imports` array.
- Updates the global `app.i18n.ts` type map with the new scope.

**Examples**

**Auto-detect component in current directory:**
```bash
cd src/app/features/dashboard
ng g app-i18n
```
```
src/app/features/dashboard/
  dashboard.i18n.ts          # new
  dashboard.component.ts     # updated with providers + imports
```

**Explicit name and path:**
```bash
ng g app-i18n --name settings --path src/app/features/settings
```
```
src/app/features/settings/
  settings.i18n.ts
```

**With Spanish pluralization:**
```bash
ng g app-i18n --name usuario --lang es
```
```
src/app/features/usuario/
  usuario.i18n.ts    # scope key: "usuario", pluralization uses Spanish rules
```

---

### `app-component`

> Alias: `ng g app-component` (when collection is registered via `ng add`)

**Description**: Generates an Angular component with optional i18n and NgRx support. Delegates to `@schematics/angular:component` for base generation, then optionally chains `app-store` and `app-i18n` schematics.

**Usage**
```bash
# Short form:
ng g app-component --name product-list

# Full form:
ng generate @barcidev/ngx-autogen:app-component --name product-list
```

**Options**

| Option | Type | Default | Required | Description |
|---|---|---|---|---|
| `name` | `string` | - | **Yes** | Name of the component. |
| `store` | `string` | - | No | Whether to create a store for the component. Enum: `Yes`, `No`. |
| `i18n` | `string` | - | No | Whether to create an i18n file for the component. Enum: `Yes`, `No`. |
| `pk` | `string` | `id` | No | The name of the default Primary Key. Only used when `store` is `Yes`. |
| `isProvideInRoot` | `boolean` | `false` | No | Whether the store and service should be provided in root. Only used when `store` is `Yes`. |
| `path` | `string` | *(cwd)* | No | Destination path. |
| `lang` | `string` | *(global)* | No | Language for pluralization (`en`, `es`). |
| `style` | `string` | `css` | No | The file extension or preprocessor to use for style files. |
| `skipTests` | `boolean` | `false` | No | Do not create `spec.ts` test files. |
| `inlineStyle` | `boolean` | `false` | No | Include styles inline in the component `.ts` file. |
| `inlineTemplate` | `boolean` | `false` | No | Include template inline in the component `.ts` file. |

**Interactive prompts** (when `store` is `Yes`):

| Prompt | Default |
|---|---|
| What is the name of the entity store to create? | *(component name)* |
| What is the name of the default Primary Key? | `id` |
| Should the store and service be provided in root? | `No` |

**What it generates**

The base component is generated by the official `@schematics/angular:component` schematic with `standalone: true`. Depending on options:

- **With `store: Yes`**: Chains `app-store` schematic inside the component directory, injects the store into the component class, adds `JsonPipe` to imports, wires `data$` computed property, and configures `providers` with `provide<Name>Store()` (unless `isProvideInRoot` is true). Also updates the `.spec.ts` with store mock providers.
- **With `i18n: Yes`**: Chains `app-i18n` schematic inside the component directory.

**Examples**

**Minimal - Component only:**
```bash
ng g app-component --name dashboard --store No --i18n No
```
```
src/app/dashboard/
  dashboard.component.ts
  dashboard.component.html
  dashboard.component.css
  dashboard.component.spec.ts
```

**Component with store and i18n:**
```bash
ng g app-component --name product-list --store Yes --i18n Yes --style scss
```
```
src/app/product-list/
  product-list.component.ts     # injects ProductListStore, data$, JsonPipe, providers
  product-list.component.html   # <div *typedTransloco="let t; prefix:'productList'">
  product-list.component.scss
  product-list.component.spec.ts # TestBed configured with store mock
  product-list.i18n.ts
  state/
    index.ts
    product-list/
      product-list.model.ts
      product-list.service.ts
      product-list.store.ts
```

**Component with custom entity store name and root provider:**
```bash
ng g app-component --name user-profile --store Yes --i18n No --pk uuid --isProvideInRoot
```

When prompted for the entity store name, enter `user` instead of the default `user-profile`:

```
src/app/user-profile/
  user-profile.component.ts     # injects UserStore (not UserProfileStore)
  user-profile.component.html
  user-profile.component.css
  user-profile.component.spec.ts
  state/
    index.ts
    user/
      user.model.ts             # pk field: uuid
      user.service.ts           # @Injectable({ providedIn: 'root' })
      user.store.ts             # signalStore({ providedIn: 'root' }, ...)
```

---

## License

[MIT](./LICENSE) - Jorge Palacio Barcinilla

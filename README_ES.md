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
  Schematics de Angular que generan entidades completas de NgRx Signal Store, scopes de i18n para Transloco y componentes standalone en segundos.
</p>

---

## Tabla de Contenidos

- [Resumen](#resumen)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
  - [Vía ng add (recomendado)](#vía-ng-add-recomendado)
  - [Vía npm](#vía-npm)
- [Exports de Runtime](#exports-de-runtime)
- [Referencia de Schematics](#referencia-de-schematics)
  - [ng-add](#ng-add)
  - [app-store](#app-store)
  - [app-i18n](#app-i18n)
  - [app-component](#app-component)
- [Licencia](#licencia)

---

## Resumen

`@barcidev/ngx-autogen` es una colección de schematics para Angular diseñada para eliminar el scaffolding repetitivo al construir aplicaciones empresariales. Genera código listo para producción enfocado en tres áreas principales:

- **NgRx Signal Store** (`app-store`) - Un store de señales CRUD completo con gestión de entidades, estado de pagación, seguimiento de estado y una capa de servicio y modelo. Basado en `@ngrx/signals` y `@ngrx/signals/entities`.
- **Transloco i18n** (`app-i18n`) - Archivos de traducción con integración tipada de Transloco vía `@barcidev/typed-transloco`, registro automático de providers y actualización global del mapa de tipos.
- **Componente Angular** (`app-component`) - Generación de componentes standalone vía `@schematics/angular` con cableado opcional automático para el store e i18n.

La librería también incluye utilidades de runtime bajo `@barcidev/ngx-autogen/entity` que proporcionan características reutilizables para NgRx Signal Store: `withEntityStatus`, `withPagination` y ayudantes para modelos tipados.

---

## Requisitos

| Dependencia | Versión Mínima |
|---|---|
| `@angular/core` | `>=17.0.0` |
| `@angular/common` | `>=17.0.0` |
| `@angular/forms` | `>=17.0.0` |
| `@ngrx/signals` | `>=17.0.0` |
| Node.js | `>=16.0.0` |

---

## Instalación

### Vía ng add (recomendado)

```bash
ng add @barcidev/ngx-autogen
```

Este comando realiza las siguientes acciones automáticamente:

1. **Mueve la librería a `devDependencies`** - Si se instaló como una dependencia de producción, se reubica en `devDependencies` en el `package.json`.
2. **Registra la colección de schematics** - Añade `@barcidev/ngx-autogen` a `cli.schematicCollections` en `angular.json`, habilitando alias cortos como `ng g app-store`.
3. **Almacena la configuración global** - Guarda el idioma predeterminado seleccionado (`lang`) bajo `schematics["@barcidev/ngx-autogen:all"]` en `angular.json` para que todos los schematics lo hereden.

**Prompt:**

| Pregunta | Por defecto |
|---|---|
| ¿Cuál es el idioma predeterminado para la aplicación (en, es)? | `en` |

### Vía npm

```bash
npm install @barcidev/ngx-autogen --save-dev
```

> [!NOTE]
> Al instalar vía npm, debe registrar manualmente la colección en `angular.json` y usar el nombre completo del schematic (ej: `ng generate @barcidev/ngx-autogen:app-store`).

---

## Exports de Runtime

La librería exporta características reutilizables para NgRx Signal Store bajo el punto de entrada `@barcidev/ngx-autogen/entity`:

| Export | Descripción |
|---|---|
| `withEntityStatus()` | Característica del Signal Store que añade seguimiento de carga, errores y estado de selección para las entidades. |
| `withPagination()` | Característica del Signal Store que añade estado de paginación (página, tamaño, total). |
| `RequestConfig<TPayload, TResponse>` | Tipo genérico para configuraciones de métodos del store con callbacks `payload`, `onSuccess` y `onError`. |
| `FormGroupType<T>` | Tipo de utilidad que mapea una interfaz a sus tipos de control de `FormGroup` de Angular. |

```typescript
import { withEntityStatus, withPagination, RequestConfig, FormGroupType } from '@barcidev/ngx-autogen/entity';
```

---

## Referencia de Schematics

### `ng-add`

**Descripción**: Schematic de ng add para ngx-autogen. Configura el espacio de trabajo para usar todos los schematics de la librería.

**Uso**
```bash
ng add @barcidev/ngx-autogen
```

**Opciones**

| Opción | Tipo | Por defecto | Requerido | Descripción |
|---|---|---|---|---|
| `lang` | `string` | `en` | No | El idioma predeterminado para la aplicación (`en`, `es`). |

---

### `app-store`

> Alias: `ng g app-store` (cuando la colección está registrada vía `ng add`)

**Descripción**: Añade NgRx Store a la aplicación Angular con soporte para señales. Genera un signal store CRUD completo, servicio y capa de modelo para una entidad dada.

**Uso**
```bash
# Forma corta (requiere ng add):
ng g app-store --name product

# Forma completa:
ng generate @barcidev/ngx-autogen:app-store --name product
```

**Opciones**

| Opción | Tipo | Por defecto | Requerido | Descripción |
|---|---|---|---|---|
| `name` | `string` | - | **Sí** | Nombre de la entidad. Se usa para derivar todos los nombres de clases, archivos y métodos del store. |
| `path` | `string` | *(cwd)* | No | Ruta de destino. Por defecto es el directorio de trabajo actual relativo a `src/`. |
| `grouped` | `boolean` | `false` | No | Indica si los archivos deben agruparse en subcarpetas `models/` y `services/`. |
| `pk` | `string` | `id` | No | El nombre de la clave primaria predeterminada (ej: `id`, `cod`, `uuid`). |
| `lang` | `string` | *(global)* | No | El idioma predeterminado para la aplicación (`en`, `es`). Heredado de la configuración de `ng add`. |
| `isProvideInRoot` | `boolean` | `false` | No | Indica si el store y el servicio deben usar `providedIn: 'root'`. |

**Qué genera**

Para un nombre de entidad dado, este schematic crea:

- `<name>.store.ts` - Signal Store de NgRx con métodos CRUD completos (`add`, `load`, `update`, `remove`, `select`), configuración de entidad, selectores computados y hook `onInit`.
- `<name>.service.ts` - Servicio inyectable con métodos base para `add$`, `get$` (pluralizado), `update$` y `remove$`.
- `<name>.model.ts` - Interfaces TypeScript: `Add<Name>`, `<Name>Dto`, `Update<Name>`, `Add<Name>Form` y `<Name>Request`.
- `state/index.ts` - Archivo barrel con re-exports (creado o actualizado).

También:
- Instala `@ngrx/signals` si no está presente (coincidiendo con la versión mayor de Angular).
- Configura el alias de ruta `@shared-state/*` en `tsconfig.app.json`.
- Guarda los valores predeterminados de `pk` y `lang` en `angular.json`.

**Ejemplos**

**Mínimo - Entidad con valores por defecto:**
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

**Diseño agrupado con PK personalizada:**
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

**Proporcionado en root con pluralización en español:**
```bash
ng g app-store --name usuario --isProvideInRoot --lang es
```
```
src/app/state/
  index.ts
  usuario/
    usuario.model.ts      # interfaces con pk: id
    usuario.service.ts    # @Injectable({ providedIn: 'root' })
    usuario.store.ts      # signalStore({ providedIn: 'root' }, ...) - los métodos usan "Usuarios" (plural en español)
```

---

### `app-i18n`

> Alias: `ng g app-i18n` (cuando la colección está registrada vía `ng add`)

**Descripción**: Añade Transloco a la aplicación Angular. Genera un archivo de traducción con scope i18n y lo conecta al componente objetivo.

**Uso**
```bash
# Forma corta:
ng g app-i18n --name dashboard

# Forma completa:
ng generate @barcidev/ngx-autogen:app-i18n --name dashboard
```

**Opciones**

| Opción | Tipo | Por defecto | Requerido | Descripción |
|---|---|---|---|---|
| `name` | `string` | *(auto-detect)* | No | Nombre del componente. Se detecta automáticamente del archivo `.component.ts` en el directorio actual si no se proporciona. |
| `path` | `string` | *(cwd)* | No | Ruta de destino. Por defecto es el directorio de trabajo actual relativo a `src/`. |
| `lang` | `string` | *(global)* | No | Idioma para la pluralización (`en` para inglés, `es` para español). |

**Qué genera**

- `<name>.i18n.ts` - Archivo de scope de traducción con objetos `en-US` y `es-CO` registrados vía `TranslocoUtils.createScopeConfig`.

También:
- Ejecuta `@barcidev/typed-transloco:ng-add` si Transloco aún no está configurado en el proyecto.
- Añade `provideTranslocoScopeWrapper` al array de `providers` del componente.
- Añade `AppTypedTranslocoDirective` al array de `imports` del componente.
- Actualiza el mapa de tipos global `app.i18n.ts` con el nuevo scope.

**Ejemplos**

**Auto-detectar componente en el directorio actual:**
```bash
cd src/app/features/dashboard
ng g app-i18n
```
```
src/app/features/dashboard/
  dashboard.i18n.ts          # nuevo
  dashboard.component.ts     # actualizado con providers + imports
```

**Nombre y ruta explícitos:**
```bash
ng g app-i18n --name settings --path src/app/features/settings
```
```
src/app/features/settings/
  settings.i18n.ts
```

**Con pluralización en español:**
```bash
ng g app-i18n --name usuario --lang es
```
```
src/app/features/usuario/
  usuario.i18n.ts    # clave de scope: "usuario", la pluralización usa reglas del español
```

---

### `app-component`

> Alias: `ng g app-component` (cuando la colección está registrada vía `ng add`)

**Descripción**: Genera un componente de Angular con soporte opcional para i18n y NgRx. Delega en `@schematics/angular:component` para la generación base, luego encadena opcionalmente los schematics `app-store` y `app-i18n`.

**Uso**
```bash
# Forma corta:
ng g app-component --name product-list

# Forma completa:
ng generate @barcidev/ngx-autogen:app-component --name product-list
```

**Opciones**

| Opción | Tipo | Por defecto | Requerido | Descripción |
|---|---|---|---|---|
| `name` | `string` | - | **Sí** | Nombre del componente. |
| `store` | `string` | - | No | Indica si se debe crear un store para el componente. Enum: `Yes`, `No`. |
| `i18n` | `string` | - | No | Indica si se debe crear un archivo i18n para el componente. Enum: `Yes`, `No`. |
| `pk` | `string` | `id` | No | El nombre de la clave primaria predeterminada. Solo se usa cuando `store` es `Yes`. |
| `isProvideInRoot` | `boolean` | `false` | No | Indica si el store y el servicio deben proporcionarse en root. Solo se usa cuando `store` es `Yes`. |
| `path` | `string` | *(cwd)* | No | Ruta de destino. |
| `lang` | `string` | *(global)* | No | Idioma para la pluralización (`en`, `es`). |
| `style` | `string` | `css` | No | La extensión de archivo o preprocesador a usar para los archivos de estilo. |
| `skipTests` | `boolean` | `false` | No | No crear archivos de prueba `spec.ts`. |
| `inlineStyle` | `boolean` | `false` | No | Incluir estilos inline en el archivo `.ts` del componente. |
| `inlineTemplate` | `boolean` | `false` | No | Incluir plantilla inline en el archivo `.ts` del componente. |

**Prompts interactivos** (cuando `store` es `Yes`):

| Pregunta | Por defecto |
|---|---|
| What is the name of the entity store to create? | *(nombre del componente)* |
| What is the name of the default Primary Key? | `id` |
| Should the store and service be provided in root? | `No` |

**Qué genera**

El componente base es generado por el schematic oficial `@schematics/angular:component` con `standalone: true`. Dependiendo de las opciones:

- **Con `store: Yes`**: Encadena el schematic `app-store` dentro del directorio del componente, inyecta el store en la clase del componente, añade `JsonPipe` a los imports, conecta la propiedad computada `data$` y configura los `providers` con `provide<Name>Store()` (a menos que `isProvideInRoot` sea true). También actualiza el `.spec.ts` con providers de mock para el store.
- **Con `i18n: Yes`**: Encadena el schematic `app-i18n` dentro del directorio del componente.

**Ejemplos**

**Mínimo - Solo componente:**
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

**Componente con store e i18n:**
```bash
ng g app-component --name product-list --store Yes --i18n Yes --style scss
```
```
src/app/product-list/
  product-list.component.ts     # inyecta ProductListStore, data$, JsonPipe, providers
  product-list.component.html   # <div *typedTransloco="let t; prefix:'productList'">
  product-list.component.scss
  product-list.component.spec.ts # TestBed configurado con mock del store
  product-list.i18n.ts
  state/
    index.ts
    product-list/
      product-list.model.ts
      product-list.service.ts
      product-list.store.ts
```

**Componente con nombre de store personalizado y provider en root:**
```bash
ng g app-component --name user-profile --store Yes --i18n No --pk uuid --isProvideInRoot
```

Cuando se le pida el nombre del entity store, ingrese `user` en lugar del predeterminado `user-profile`:

```
src/app/user-profile/
  user-profile.component.ts     # inyecta UserStore (no UserProfileStore)
  user-profile.component.html
  user-profile.component.css
  user-profile.component.spec.ts
  state/
    index.ts
    user/
      user.model.ts             # campo pk: uuid
      user.service.ts           # @Injectable({ providedIn: 'root' })
      user.store.ts             # signalStore({ providedIn: 'root' }, ...)
```

---

## Licencia

[MIT](./LICENSE) - Jorge Palacio Barcinilla

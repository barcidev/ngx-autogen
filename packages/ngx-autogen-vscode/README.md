# ngx-autogen-vscode

Generate NgRx Signal Store, Transloco i18n scopes and Angular components from the context menu in VS Code.

## Features

Provides a context menu in the explorer to generate artifacts identical to the `@barcidev/ngx-autogen` library.

### Commands
- **Generate Store (app-store)**: Scaffolds a complete NgRx Signal Store with entity support.
- **Generate i18n Scope (app-i18n)**: Creates a new Transloco i18n scope configuration.
- **Generate Component (app-component)**: Creates an Angular standalone component, optionally including a local store and i18n scope.

## Requirements
If you generate stores or i18n scopes, the extension will ask to install `@barcidev/ngx-autogen` as a dev dependency to resolve some runtime types.

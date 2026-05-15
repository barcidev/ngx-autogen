<p align="center">
  <img src="https://raw.githubusercontent.com/jpalacio09/ngx-autogen/main/logo.png" alt="ngx-autogen logo" width="128">
</p>

# Ngx Autogen for VS Code

**Ngx Autogen** is a productivity-focused VS Code extension that brings the power of `@barcidev/ngx-autogen` schematics directly to your workspace's context menu. Scaffold enterprise-grade Angular artifacts in seconds without leaving your editor.

[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/JorgePalacioBarcinilla.ngx-autogen-vscode?style=for-the-badge&color=007acc&labelColor=010101)](https://marketplace.visualstudio.com/items?itemName=JorgePalacioBarcinilla.ngx-autogen-vscode)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/JorgePalacioBarcinilla.ngx-autogen-vscode?style=for-the-badge&color=green&labelColor=010101)](https://marketplace.visualstudio.com/items?itemName=JorgePalacioBarcinilla.ngx-autogen-vscode)
[![License](https://img.shields.io/github/license/jpalacio09/ngx-autogen?style=for-the-badge&color=orange&labelColor=010101)](https://github.com/jpalacio09/ngx-autogen/blob/main/LICENSE)

---

## 🚀 Overview

Tired of manual boilerplate? **Ngx Autogen** automates the generation of:

- ⚡ **NgRx Signal Stores**: Full CRUD state management with entity support, pagination, and status tracking.
- 🌍 **Transloco i18n Scopes**: Fully typed translation files with automatic provider registration.
- 🏗️ **Angular Components**: Standalone components pre-wired with stores and i18n support.

---

## 📸 Demo

![Ngx Autogen Demo](https://raw.githubusercontent.com/jpalacio09/ngx-autogen/main/packages/ngx-autogen-vscode/screenshot.png)

---

## ✨ Features

### 📦 Smart Store Generation
Right-click any folder to generate a complete **NgRx Signal Store**. It automatically creates the `.store.ts`, `.service.ts`, and `.model.ts` files, plus updates your barrel exports.

### 🌐 Instant i18n Scopes
Generate translation scopes for **Transloco** in one click. The extension handles the boilerplate of creating the scope file and injecting it into your component.

### 🧩 Advanced Component Scaffolding
Generate a standalone component and optionally scaffold its state and translations at the same time. Everything is wired up and ready to use.

### ⚙️ Persistence & Interactive Mode
- **Zero-Config Flow**: Uses your project's `.autogen/config.json` (or `angular.json`) to skip repetitive prompts.
- **Interactive Mode**: Need something custom? Use the "Custom" commands to override defaults on the fly.

---

## 🛠️ Requirements

To use the generated artifacts, your project should have the following dependencies installed:

- **Angular**: 17.0.0+
- **@ngrx/signals**: 17.0.0+
- **@jsverse/transloco**: 7.0.0+ (for i18n features)

The extension will automatically offer to install `@barcidev/ngx-autogen` as a dev dependency if it's not present, which is required for the schematics to run.

---

## 🔧 Configuration

The extension respects the configuration stored in:
1. `angular.json` (under `schematics` section).
2. `.autogen/config.json` (local override).

Example `config.json`:
```json
{
  "lang": "es",
  "pk": "uuid",
  "isProvideInRoot": true
}
```

---

## ⚖️ License

[MIT](./LICENSE) - Jorge Palacio Barcinilla

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
exports.generateComponent = generateComponent;
const path = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
const file_utils_1 = require("../utils/file.utils");
const install_utils_1 = require("../utils/install.utils");
const string_utils_1 = require("../utils/string.utils");
const i18n_generator_1 = require("./i18n.generator");
const store_generator_1 = require("./store.generator");
async function generateComponent(targetPath, options) {
    const nameDash = (0, string_utils_1.dasherize)(options.name);
    const nameClass = (0, string_utils_1.classify)(options.name);
    const selectorName = (0, string_utils_1.toSelectorName)(options.name);
    const compDir = path.join(targetPath, nameDash);
    (0, file_utils_1.ensureDir)(compDir);
    let imports = `import { Component, OnInit${options.generateStore ? ', inject' : ''} } from '@angular/core';\nimport { CommonModule${options.generateStore ? ', JsonPipe' : ''} } from '@angular/common';\n`;
    let providers = ``;
    let componentImports = `CommonModule${options.generateStore ? ', JsonPipe' : ''}`;
    let classProperties = ``;
    let templateContent = ``;
    if (options.generateStore && options.storeOptions) {
        const storeClass = (0, string_utils_1.classify)(options.storeOptions.entityName);
        const storeVar = (0, string_utils_1.camelize)(options.storeOptions.entityName);
        const storeDash = (0, string_utils_1.dasherize)(options.storeOptions.entityName);
        imports += `import { ${storeClass}Store${!options.storeOptions.provideInRoot ? `, provide${storeClass}Store` : ''} } from './state/${storeDash}/${storeDash}.store';\n`;
        if (!options.storeOptions.provideInRoot) {
            providers += `\n    ...provide${storeClass}Store(),`;
        }
        classProperties += `  private readonly _${storeVar}Store = inject(${storeClass}Store);\n  readonly data$ = this._${storeVar}Store.entities;\n\n`;
    }
    if (options.generateI18n && options.i18nOptions) {
        const i18nVar = (0, string_utils_1.camelize)(options.i18nOptions.scopeName);
        const i18nDash = (0, string_utils_1.dasherize)(options.i18nOptions.scopeName);
        imports += `import { TypedTranslocoDirective, provideTranslocoScopeWrapper } from '@barcidev/typed-transloco';\nimport { ${i18nVar}I18n } from './${i18nDash}.i18n';\n`;
        componentImports += `, TypedTranslocoDirective`;
        providers += `\n    provideTranslocoScopeWrapper(${i18nVar}I18n),`;
        templateContent = `<div *typedTransloco="let t; prefix: '${i18nVar}'">
  <h1>{{ t('title') }}</h1>
${options.generateStore ? '  <pre>{{ data$() | json }}</pre>\n' : ''}</div>\n`;
    }
    else {
        templateContent = `<div>
  <h1>${nameClass} Works!</h1>
${options.generateStore ? '  <pre>{{ data$() | json }}</pre>\n' : ''}</div>\n`;
    }
    const tsContent = `${imports}
@Component({
  selector: '${selectorName}',
  standalone: true,
  imports: [${componentImports}],
  providers: [${providers ? providers + '\n  ' : ''}],
  templateUrl: './${nameDash}.component.html',
  styleUrl: './${nameDash}.component.${options.styleExt}'
})
export class ${nameClass}Component implements OnInit {
${classProperties}  ngOnInit() {}
}\n`;
    const htmlContent = templateContent;
    const styleContent = `\n`;
    (0, file_utils_1.writeFileIfNotExists)(path.join(compDir, `${nameDash}.component.ts`), tsContent);
    (0, file_utils_1.writeFileIfNotExists)(path.join(compDir, `${nameDash}.component.html`), htmlContent);
    (0, file_utils_1.writeFileIfNotExists)(path.join(compDir, `${nameDash}.component.${options.styleExt}`), styleContent);
    if (!options.skipTests) {
        const specContent = `import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ${nameClass}Component } from './${nameDash}.component';
${options.generateStore ? `import { ${(0, string_utils_1.classify)(options.storeOptions.entityName)}Store } from './state/${(0, string_utils_1.dasherize)(options.storeOptions.entityName)}/${(0, string_utils_1.dasherize)(options.storeOptions.entityName)}.store';` : ''}

describe('${nameClass}Component', () => {
  let component: ${nameClass}Component;
  let fixture: ComponentFixture<${nameClass}Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [${nameClass}Component],
      providers: [
        ${options.generateStore ? `{ provide: ${(0, string_utils_1.classify)(options.storeOptions.entityName)}Store, useValue: { entities: () => [] } }` : ''}
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(${nameClass}Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
`;
        (0, file_utils_1.writeFileIfNotExists)(path.join(compDir, `${nameDash}.component.spec.ts`), specContent);
    }
    const regularDeps = [];
    const devDeps = [];
    if (options.generateStore && options.storeOptions) {
        await (0, store_generator_1.generateStore)(compDir, { ...options.storeOptions, skipInstallPrompt: true });
        regularDeps.push('@ngrx/signals', '@ngrx/operators');
        devDeps.push('@barcidev/ngx-autogen');
    }
    if (options.generateI18n && options.i18nOptions) {
        await (0, i18n_generator_1.generateI18n)(compDir, { ...options.i18nOptions, skipInstallPrompt: true });
        regularDeps.push('@barcidev/typed-transloco');
    }
    if (regularDeps.length > 0 || devDeps.length > 0) {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(targetPath))?.uri.fsPath || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (workspaceFolder) {
            await (0, install_utils_1.promptToInstallLibraries)(workspaceFolder, {
                regular: regularDeps,
                dev: devDeps
            });
        }
    }
    vscode.window.showInformationMessage(`✅ Component '${options.name}' generated successfully.`);
}
//# sourceMappingURL=component.generator.js.map
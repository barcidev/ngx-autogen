import * as path from 'path';
import * as vscode from 'vscode';
import { ensureDir, writeFileIfNotExists } from '../utils/file.utils';
import { promptToInstallLibraries } from '../utils/install.utils';
import { camelize, classify, dasherize, toSelectorName } from '../utils/string.utils';
import { generateI18n, I18nOptions } from './i18n.generator';
import { generateStore, StoreOptions } from './store.generator';

export interface ComponentOptions {
  name: string;
  styleExt: string;
  skipTests: boolean;
  generateStore: boolean;
  storeOptions?: StoreOptions;
  generateI18n: boolean;
  i18nOptions?: I18nOptions;
}

export async function generateComponent(targetPath: string, options: ComponentOptions) {
  const nameDash = dasherize(options.name);
  const nameClass = classify(options.name);
  const selectorName = toSelectorName(options.name);

  const compDir = path.join(targetPath, nameDash);
  ensureDir(compDir);

  let imports = `import { Component, OnInit${options.generateStore ? ', inject' : ''} } from '@angular/core';\nimport { CommonModule${options.generateStore ? ', JsonPipe' : ''} } from '@angular/common';\n`;
  let providers = ``;
  let componentImports = `CommonModule${options.generateStore ? ', JsonPipe' : ''}`;
  let classProperties = ``;
  let templateContent = ``;

  if (options.generateStore && options.storeOptions) {
    const storeClass = classify(options.storeOptions.entityName);
    const storeVar = camelize(options.storeOptions.entityName);
    const storeDash = dasherize(options.storeOptions.entityName);

    imports += `import { ${storeClass}Store${!options.storeOptions.provideInRoot ? `, provide${storeClass}Store` : ''} } from './state/${storeDash}/${storeDash}.store';\n`;

    if (!options.storeOptions.provideInRoot) {
      providers += `\n    ...provide${storeClass}Store(),`;
    }

    classProperties += `  private readonly _${storeVar}Store = inject(${storeClass}Store);\n  readonly data$ = this._${storeVar}Store.entities;\n\n`;
  }

  if (options.generateI18n && options.i18nOptions) {
    const i18nVar = camelize(options.i18nOptions.scopeName);
    const i18nDash = dasherize(options.i18nOptions.scopeName);

    imports += `import { TypedTranslocoDirective, provideTranslocoScopeWrapper } from '@barcidev/typed-transloco';\nimport { ${i18nVar}I18n } from './${i18nDash}.i18n';\n`;
    componentImports += `, TypedTranslocoDirective`;
    providers += `\n    provideTranslocoScopeWrapper(${i18nVar}I18n),`;

    templateContent = `<div *typedTransloco="let t; prefix: '${i18nVar}'">
  <h1>{{ t('title') }}</h1>
${options.generateStore ? '  <pre>{{ data$() | json }}</pre>\n' : ''}</div>\n`;
  } else {
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

  writeFileIfNotExists(path.join(compDir, `${nameDash}.component.ts`), tsContent);
  writeFileIfNotExists(path.join(compDir, `${nameDash}.component.html`), htmlContent);
  writeFileIfNotExists(path.join(compDir, `${nameDash}.component.${options.styleExt}`), styleContent);

  if (!options.skipTests) {
    const specContent = `import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ${nameClass}Component } from './${nameDash}.component';
${options.generateStore ? `import { ${classify(options.storeOptions!.entityName)}Store } from './state/${dasherize(options.storeOptions!.entityName)}/${dasherize(options.storeOptions!.entityName)}.store';` : ''}

describe('${nameClass}Component', () => {
  let component: ${nameClass}Component;
  let fixture: ComponentFixture<${nameClass}Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [${nameClass}Component],
      providers: [
        ${options.generateStore ? `{ provide: ${classify(options.storeOptions!.entityName)}Store, useValue: { entities: () => [] } }` : ''}
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
    writeFileIfNotExists(path.join(compDir, `${nameDash}.component.spec.ts`), specContent);
  }

  const regularDeps: string[] = [];
  const devDeps: string[] = [];

  if (options.generateStore && options.storeOptions) {
    await generateStore(compDir, { ...options.storeOptions, skipInstallPrompt: true });
    regularDeps.push('@ngrx/signals', '@ngrx/operators');
    devDeps.push('@barcidev/ngx-autogen');
  }

  if (options.generateI18n && options.i18nOptions) {
    await generateI18n(compDir, { ...options.i18nOptions, skipInstallPrompt: true });
    regularDeps.push('@barcidev/typed-transloco');
  }

  if (regularDeps.length > 0 || devDeps.length > 0) {
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(targetPath))?.uri.fsPath || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (workspaceFolder) {
      await promptToInstallLibraries(workspaceFolder, {
        regular: regularDeps,
        dev: devDeps
      });
    }
  }

  vscode.window.showInformationMessage(`✅ Component '${options.name}' generated successfully.`);
}

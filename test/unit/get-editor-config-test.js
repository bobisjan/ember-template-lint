'use strict';

const path = require('path');
const expect = require('chai').expect;
const EditorConfigResolver = require('../../lib/get-editor-config');
const { createTempDir } = require('broccoli-test-helper');

const initialCWD = process.cwd();

describe('get-editor-config', function() {
  let project = null;
  beforeEach(async function() {
    project = await createTempDir();
    process.chdir(project.path());
  });
  afterEach(async function() {
    process.chdir(initialCWD);
    await project.dispose();
  });

  it('able to read and add info from .editorconfig file if exists', function() {
    let filePath = path.join(project.path(), 'app.hbs');

    project.write({
      'app.hbs': '',
      '.editorconfig': `
# EditorConfig helps developers define and maintain consistent
# coding styles between different editors and IDEs
# editorconfig.org

root = true


[*]
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true
indent_style = space
indent_size = 2

[*.js]
indent_style = space
indent_size = 3

[*.hbs]
insert_final_newline = false
indent_style = space
indent_size = 12

[*.css]
indent_style = space
indent_size = 5

[*.html]
indent_style = space
indent_size = 2

[*.{diff,md}]
trim_trailing_whitespace = false
      `,
    });

    expect(new EditorConfigResolver().getEditorConfigData(filePath)).to.deep.equal({
      charset: 'utf-8',
      end_of_line: 'lf',
      indent_size: 12,
      indent_style: 'space',
      insert_final_newline: false,
      tab_width: 12,
      trim_trailing_whitespace: true,
    });
  });

  it('return empty object if no config found', function() {
    let filePath = path.join(project.path(), 'app.hbs');

    project.write({
      'app.hbs': '',
    });

    expect(new EditorConfigResolver().getEditorConfigData(filePath)).to.deep.equal({});
  });

  it('able to merge different editor config files', function() {
    let filePath = path.join(project.path(), 'app', 'app.hbs');

    project.write({
      app: {
        'app.hbs': '',
        '.editorconfig': `
[*app.hbs]
insert_final_newline = true
`,
      },
      '.editorconfig': `
[*]
indent_style = space

[*.hbs]
indent_size = 5
`,
    });

    expect(new EditorConfigResolver().getEditorConfigData(filePath)).to.deep.equal({
      indent_size: 5,
      indent_style: 'space',
      insert_final_newline: true,
      tab_width: 5,
    });
  });

  it('able to merge different config sections', function() {
    let filePath = path.join(project.path(), 'app.hbs');

    project.write({
      'app.hbs': '',
      '.editorconfig': `
[*]
indent_style = space

[*.hbs]
indent_size = 5

[*app.hbs]
insert_final_newline = true

`,
    });

    expect(new EditorConfigResolver().getEditorConfigData(filePath)).to.deep.equal({
      indent_size: 5,
      indent_style: 'space',
      insert_final_newline: true,
      tab_width: 5,
    });
  });

  it('able to resolve relative paths', function() {
    project.write({
      src: {
        'app.hbs': '',
      },
      '.editorconfig': `
[*]
indent_style = space
`,
    });

    expect(new EditorConfigResolver().getEditorConfigData('src/app.hbs')).to.deep.equal({
      indent_style: 'space',
    });
  });

  it('able to resolve config with custom name', function() {
    let filePath = path.join(project.path(), 'app.hbs');

    project.write({
      'app.hbs': '',
      '.newline': `
[*]
indent_style = space

[*.hbs]
indent_size = 5

[*app.hbs]
insert_final_newline = true

`,
    });

    expect(
      new EditorConfigResolver().getEditorConfigData(filePath, { config: '.newline' })
    ).to.deep.equal({
      indent_size: 5,
      indent_style: 'space',
      insert_final_newline: true,
      tab_width: 5,
    });
  });

  it('return default values if no hbs in editor config', function() {
    let filePath = path.join(project.path(), 'app.hbs');

    project.write({
      'app.hbs': '',
      '.editorconfig': `
[*]
indent_style = space
indent_size = 5      
`,
    });

    expect(new EditorConfigResolver().getEditorConfigData(filePath)).to.deep.equal({
      indent_size: 5,
      indent_style: 'space',
      tab_width: 5,
    });
  });

  it('return empty object if editor config not relevant', function() {
    let filePath = path.join(project.path(), 'app.hbs');

    project.write({
      'app.hbs': '',
      '.editorconfig': `
[*.css]
indent_style = space
indent_size = 5      
`,
    });

    expect(new EditorConfigResolver().getEditorConfigData(filePath)).to.deep.equal({});
  });

  it('allow specify custom editorconfig for file', function() {
    let filePath = path.join(project.path(), 'items/app.hbs');

    project.write({
      'app.hbs': '',
      items: {
        'app.hbs': '',
      },
      '.editorconfig': `
# EditorConfig helps developers define and maintain consistent
# coding styles between different editors and IDEs
# editorconfig.org

root = true


[*]
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true
indent_style = space
indent_size = 2

[*.js]
indent_style = space
indent_size = 3

[*.hbs]
insert_final_newline = false
indent_style = space
indent_size = 12

[items/**.hbs]
indent_style = tabs
insert_final_newline = true
indent_size = 14

[*.css]
indent_style = space
indent_size = 5

[*.html]
indent_style = space
indent_size = 2

[*.{diff,md}]
trim_trailing_whitespace = false
      `,
    });

    expect(new EditorConfigResolver().getEditorConfigData(filePath)).to.deep.equal({
      charset: 'utf-8',
      end_of_line: 'lf',
      indent_size: 14,
      indent_style: 'tabs',
      insert_final_newline: true,
      tab_width: 14,
      trim_trailing_whitespace: true,
    });
  });
});
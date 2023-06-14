ace.define(
  'ace/theme/editor-theme',
  ['require', 'exports', 'module', 'ace/lib/dom'],
  function (acequire, exports, module) {
    exports.isDark = true;
    exports.cssClass = 'ace-editor-theme';
    exports.cssText = `
      .ace-editor-theme .ace_gutter {
        background: #2c2f39;
        color: #b8bcc4;
      }
      .ace-editor-theme .ace_print-margin {
        width: 1px;
        background: #3b404d;
      }
      .ace-editor-theme {
        background-color: #252830;
        color: #b8bcc4;
      }
      .ace-editor-theme .ace_cursor {
        color: #aeafad;
      }
      .ace-editor-theme .ace_marker-layer .ace_selection {
        background: #30343e;
      }
      .ace-editor-theme.ace_multiselect .ace_selection.ace_start {
        box-shadow: 0 0 3px 0px #1d1f21;
      }
      .ace-editor-theme .ace_marker-layer .ace_step {
        background: rgb(102, 82, 0);
      }
      .ace-editor-theme .ace_marker-layer .ace_bracket {
        margin: -1px 0 0 -1px;
        border: 1px solid #4b4e55;
      }
      .ace-editor-theme .ace_marker-layer .ace_active-line {
        background: #252830;
      }
      .ace-editor-theme .ace_gutter-active-line {
        background-color: #252830;
      }
      .ace-editor-theme .ace_marker-layer .ace_selected-word {
        border: 1px solid #3b404d;
      }
      .ace-editor-theme .ace_invisible {
        color: #4b4e55;
      }
      .ace-editor-theme .ace_keyword,
      .ace-editor-theme .ace_meta,
      .ace-editor-theme .ace_storage,
      .ace-editor-theme .ace_storage.ace_type,
      .ace-editor-theme .ace_support.ace_type {
        color: #b294bb;
      }
      .ace-editor-theme .ace_keyword.ace_operator {
        color: #8abeb7;
      }
      .ace-editor-theme .ace_constant.ace_character,
      .ace-editor-theme .ace_constant.ace_language,
      .ace-editor-theme .ace_constant.ace_numeric,
      .ace-editor-theme .ace_keyword.ace_other.ace_unit,
      .ace-editor-theme .ace_support.ace_constant,
      .ace-editor-theme .ace_variable.ace_parameter {
        color: #de935f;
      }
      .ace-editor-theme .ace_constant.ace_other {
        color: #ced1cf;
      }
      .ace-editor-theme .ace_invalid {
        color: #ced2cf;
        background-color: #df5f5f;
      }
      .ace-editor-theme .ace_invalid.ace_deprecated {
        color: #ced2cf;
        background-color: #b798bf;
      }
      .ace-editor-theme .ace_fold {
        background-color: #81a2be;
        border-color: #c5c8c6;
      }
      .ace-editor-theme .ace_entity.ace_name.ace_function,
      .ace-editor-theme .ace_support.ace_function,
      .ace-editor-theme .ace_variable {
        color: #81a2be;
      }
      .ace-editor-theme .ace_support.ace_class,
      .ace-editor-theme .ace_support.ace_type {
        color: #f0c674;
      }
      .ace-editor-theme .ace_heading,
      .ace-editor-theme .ace_markup.ace_heading,
      .ace-editor-theme .ace_string {
        color: #b5bd68;
      }
      .ace-editor-theme .ace_entity.ace_name.ace_tag,
      .ace-editor-theme .ace_entity.ace_other.ace_attribute-name,
      .ace-editor-theme .ace_meta.ace_tag,
      .ace-editor-theme .ace_string.ace_regexp,
      .ace-editor-theme .ace_variable {
        color: #cc6666;
      }
      .ace-editor-theme .ace_comment {
        color: #969896;
      }
      .ace-editor-theme .ace_indent-guide {
        background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACZgbYnAAAAEklEQVQImWNgYGBgYHB3d/8PAAOIAdULw8qMAAAAAElFTkSuQmCC)
          right repeat-y;
      }
      .ace-editor-theme .ace_search {
        color: #a7acba;
        background-color: #21232a;
        border-color: #292d36;
      }
      .ace-editor-theme .ace_search_form.ace_nomatch {
        outline: 1px solid #bf4e46;
      }
      .ace-editor-theme .ace_search_field {
        color: #eef0f3;
        background-color: #353944;
        border-color: #353944;
        border-radius: 0;
      }
      .ace-editor-theme .ace_search_field:focus {
        border-color: #454a5b;
        transition: all 100ms ease-in-out;
      }
      .ace-editor-theme .ace_search_field::placeholder {
        color: #878c9a;
      }
      .ace-editor-theme .ace_search .ace_button {
        color: #878c9a;
        border: none;
      }
      .ace-editor-theme .ace_search .ace_button:hover {
        color: #b8bcc4;
        background-color: #21232a;
      }
      .ace-editor-theme .ace_search .ace_button.checked {
        color: #b8bcc4;
      }
      .ace-editor-theme .ace_searchbtn {
        background-color: #21232a;
        border-color: #21232a;
      }
      .ace-editor-theme .ace_searchbtn {
        color: #878c9a;
      }
      .ace-editor-theme .ace_searchbtn:hover {
        color: #b8bcc4;
      }
      .ace-editor-theme .ace_searchbtn::after {
        border-color: #878c9a;
      }
      .ace-editor-theme .ace_searchbtn:hover::after {
        border-color: #b8bcc4;
      }
      .ace-editor-theme.ace_autocomplete {
        background-color: #353944;
        border: 1px solid #454a5b;
        width: 20vw;
        box-shadow:none;
      }
      .ace-editor-theme.ace_autocomplete .ace_line {
        color: #b8bcc4;
        padding: 0px 10px;
      }
      .ace_editor.ace_autocomplete .ace_line .ace_completion-highlight {
        color: #b8bcc4;
        text-shadow: none;
      }
      .ace_editor.ace_autocomplete .ace_line.ace_selected .ace_completion-highlight {
        color: #fff;
        text-shadow: none;
      }
      .ace_editor.ace_autocomplete .ace_marker-layer .ace_active-line {
        background-color: #393e4a;
      }
      .ace-editor-theme.ace_autocomplete .ace_line.ace_selected {
        color: #fff;
      }
      .ace-editor-theme.ace_autocomplete .ace_line .ace_rightAlignedText {
        color: #b8bcc4;
      }
      .ace_editor.ace_autocomplete .ace_line-hover {
        border: 1px solid transparent;
        background-color: #393e4a;
      }

      .editor-fade-out {
        .ace_line_group:nth-child(n+6) .ace_line {
          position: relative;

          &::after {
            content: '';
            position: absolute;
            width: 100%;
            height: 100%;
            left: 0;
            top: 0;
          }
        }
        .ace_line_group:nth-child(n+6) .ace_line {
          &::after {
            background: linear-gradient(to bottom, transparent, #25283080 100%);
          }
        }
        .ace_line_group:nth-child(n+7) .ace_line {
          &::after {
            background: linear-gradient(to bottom, #25283080, #252830BF 100%);
          }
        }
        .ace_line_group:nth-child(n+8) .ace_line {
          &::after {
            background: linear-gradient(to bottom, #252830BF, #252830 100%);
          }
        }
        .ace_line_group:nth-child(n+9) .ace_line {
          &::after {
            background: #252830;
          }
        }
      }
    `;

    const dom = acequire('../lib/dom');
    dom.importCssString(exports.cssText, exports.cssClass);
  }
);

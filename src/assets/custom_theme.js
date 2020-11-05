ace.define(
  'ace/theme/custom_theme',
  ['require', 'exports', 'module', 'ace/lib/dom'],
  function (acequire, exports, module) {
    exports.isDark = true;
    exports.cssClass = 'ace-custom-theme';
    exports.cssText = `.ace-custom-theme .ace_gutter {
background: #2c2f39;
color: #B8BCC4
}
.ace-custom-theme .ace_print-margin {
width: 1px;
background: #3b404d
}
.ace-custom-theme {
background-color: #252830;
color: #B8BCC4
}
.ace-custom-theme .ace_cursor {
color: #AEAFAD
}
.ace-custom-theme .ace_marker-layer .ace_selection {
background: #30343e
}
.ace-custom-theme.ace_multiselect .ace_selection.ace_start {
box-shadow: 0 0 3px 0px #1D1F21;
}
.ace-custom-theme .ace_marker-layer .ace_step {
background: rgb(102, 82, 0)
}
.ace-custom-theme .ace_marker-layer .ace_bracket {
margin: -1px 0 0 -1px;
border: 1px solid #4B4E55
}
.ace-custom-theme .ace_marker-layer .ace_active-line {
background: #252830
}
.ace-custom-theme .ace_gutter-active-line {
background-color: #252830
}
.ace-custom-theme .ace_marker-layer .ace_selected-word {
border: 1px solid #3b404d
}
.ace-custom-theme .ace_invisible {
color: #4B4E55
}
.ace-custom-theme .ace_keyword,
.ace-custom-theme .ace_meta,
.ace-custom-theme .ace_storage,
.ace-custom-theme .ace_storage.ace_type,
.ace-custom-theme .ace_support.ace_type {
color: #B294BB
}
.ace-custom-theme .ace_keyword.ace_operator {
color: #8ABEB7
}
.ace-custom-theme .ace_constant.ace_character,
.ace-custom-theme .ace_constant.ace_language,
.ace-custom-theme .ace_constant.ace_numeric,
.ace-custom-theme .ace_keyword.ace_other.ace_unit,
.ace-custom-theme .ace_support.ace_constant,
.ace-custom-theme .ace_variable.ace_parameter {
color: #DE935F
}
.ace-custom-theme .ace_constant.ace_other {
color: #CED1CF
}
.ace-custom-theme .ace_invalid {
color: #CED2CF;
background-color: #DF5F5F
}
.ace-custom-theme .ace_invalid.ace_deprecated {
color: #CED2CF;
background-color: #B798BF
}
.ace-custom-theme .ace_fold {
background-color: #81A2BE;
border-color: #C5C8C6
}
.ace-custom-theme .ace_entity.ace_name.ace_function,
.ace-custom-theme .ace_support.ace_function,
.ace-custom-theme .ace_variable {
color: #81A2BE
}
.ace-custom-theme .ace_support.ace_class,
.ace-custom-theme .ace_support.ace_type {
color: #F0C674
}
.ace-custom-theme .ace_heading,
.ace-custom-theme .ace_markup.ace_heading,
.ace-custom-theme .ace_string {
color: #B5BD68
}
.ace-custom-theme .ace_entity.ace_name.ace_tag,
.ace-custom-theme .ace_entity.ace_other.ace_attribute-name,
.ace-custom-theme .ace_meta.ace_tag,
.ace-custom-theme .ace_string.ace_regexp,
.ace-custom-theme .ace_variable {
color: #CC6666
}
.ace-custom-theme .ace_comment {
color: #969896
}
.ace-custom-theme .ace_indent-guide {
background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACZgbYnAAAAEklEQVQImWNgYGBgYHB3d/8PAAOIAdULw8qMAAAAAElFTkSuQmCC) right repeat-y
}
.ace-custom-theme .ace_search {
color: #A7ACBA;
background-color: #21232a;
border-color: #292d36;
}
.ace-custom-theme .ace_search_form.ace_nomatch {
outline: 1px solid #bf4e46;
}
.ace-custom-theme .ace_search_field {
color: #EEF0F3;
background-color: #353944;
border-color: #353944;
border-radius: 0;
}
.ace-custom-theme .ace_search_field:focus {
border-color: #454A5B;
transition: all 100ms ease-in-out
}
.ace-custom-theme .ace_search_field::placeholder {
color: #878C9A;
}
.ace-custom-theme .ace_search .ace_button {
color: #878C9A;
border: none;
}
.ace-custom-theme .ace_search .ace_button:hover {
color: #B8BCC4;
background-color: #21232a;
}
.ace-custom-theme .ace_search .ace_button.checked {
color: #B8BCC4;
}
.ace-custom-theme .ace_searchbtn {
background-color: #21232a;
border-color: #21232a;
}
.ace-custom-theme .ace_searchbtn {
color: #878C9A;
}
.ace-custom-theme .ace_searchbtn:hover {
color: #B8BCC4;
}
.ace-custom-theme .ace_searchbtn::after {
border-color: #878C9A;
}
.ace-custom-theme .ace_searchbtn:hover::after {
border-color: #B8BCC4;
}`;

    const dom = acequire('../lib/dom');
    dom.importCssString(exports.cssText, exports.cssClass);
  }
);

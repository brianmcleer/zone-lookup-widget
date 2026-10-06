# Conditional result templates

Added in Zone Lookup 1.5.0. Put the following in **Result HTML template**:

```html
{{#if Municipality}}
  <p>Incorporated {Municipality}</p>
{{else}}
  <p>Unincorporated {Township} Township</p>
{{/if}}
```

A populated Municipality produces `Incorporated Example City`. Otherwise the widget uses Township and produces `Unincorporated Example Township`. When both are populated, Municipality takes priority.

This is the widget's template syntax, not Arcade, JavaScript, or Handlebars. It implements this field-presence choice without adding an expression engine or a dependency. Do not paste an Arcade expression into the HTML editor. The widget does not evaluate web-map popup expressions or create new expression fields.

## Rules

- `{FIELD_NAME}` inserts the field's value as escaped text, as before.
- `{{#if FIELD_NAME}}` tests whether the raw attribute is populated. Missing fields, null, undefined, empty strings, and whitespace-only strings count as empty. The literal strings `null` and `NULL`, numeric zero, and boolean false are populated values. Whitespace-only handling is an intentional addition beyond Arcade's basic IsEmpty test.
- `{{else}}` is optional. Each block needs one `{{/if}}`. Blocks may be nested, up to 64 levels. Comparison expressions, functions, `else if`, and `unless` are not supported.
- Field names may contain ASCII letters, digits, and underscores, with a letter or underscore first. Use actual field names, not aliases. Capitalization is ignored when an exact match is unavailable.
- Conditions are evaluated before values are inserted. Attribute values cannot introduce another conditional or a second field lookup. Values are HTML-escaped, including quotes. Existing UTC long-date formatting is retained.
- Use the syntax in `resultTemplate` or `cascadePriorityTemplate`. It is not evaluated in Intro HTML, plain-text labels, Hero title field, or Hero subtitle field. To place this conditional heading at the top of the answer, leave both hero fields set to `(none)` and use heading HTML in the result template.

## Both fields may be blank

```html
{{#if Municipality}}
  <p>Incorporated {Municipality}</p>
{{else}}
  {{#if Township}}
    <p>Unincorporated {Township} Township</p>
  {{else}}
    <p>Area information is unavailable.</p>
  {{/if}}
{{/if}}
```

## XML

`examples/municipality-township.html` is ready to paste into the result editor. `examples/municipality-township.xml` is a partial configuration containing only `resultTemplate`. Importing that sample changes the result template, not the configured services, map, labels, or other settings. Keep a copy of the previous result template before replacing it.

The existing XML export/import functions and schema are unchanged. CDATA preserves the HTML and conditional braces. A full configuration imported into a different experience still requires choosing that experience's map and layer references.

## Validation and troubleshooting

The result editor shows an error for an unmatched if, extra else, invalid field expression, or excessive nesting. Fix the block before publishing. Runtime template failures use a fixed message and the existing live region instead of displaying parser text or incomplete HTML.

A field always uses the else branch: check its actual service field name and whether the returned attribute is populated. An empty field is deliberately different from zero or false.

Raw Arcade appears in the answer: this feature does not execute Arcade. Replace it with the template example above.

The wrong title still appears above the answer: the hero uses its own field selectors. Set those to `(none)` when the conditional template should provide the heading.

A dangerous link is still possible in an author-supplied template: HTML-escaping field text is not a complete HTML or URL sanitizer. Templates are trusted app-author content. Do not insert untrusted attributes into executable contexts or unchecked URL attributes. This update does not change the existing HTML trust model.

## Reference

Esri's definition of the basic IsEmpty function: https://developers.arcgis.com/arcade/function-reference/logical_functions/#isemptyvalue---boolean

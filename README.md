# HOF-Component-Date

A component for handling the rendering and processing of 3-input date fields used in HOF Applications.

## Usage

In your fields config:
```js
const dateComponent = require('hof-component-date');

module.exports = {
  'date-field': dateComponent('date-field', {
    validate: ['required', 'before']
  })
}
```

The above example will create a new date component with the key `'date-field'` and will apply the validators `required` and `before` (before today).

## Configuration

The following optional configuration options are supported:

* `validate {String|Array}` - validators to use on the processed date field
* `template` - an absolute path to an alternate template.
* `dayOptional {Boolean}` - day defaults to `01` if omitted. Defaults to `false`
* `monthOptional {Boolean}` - month defaults to `01` if omitted. If true then also forces `dayOptional` to be true. Defaults to `false`

## Labels

The three intermedate fields have fallback labels of Day, Month and Year, however custom labels can be used by including the translation at the following path:

fields.json
```json
{
  "field-name": {
    "parts": {
      "day": {
        "label": "Custom Day Label"
      },
      "month": {
        "label": "Custom Month Label"
      },
      "year": {
        "label": "Custom Year Label"
      }
    }
  }
}
```

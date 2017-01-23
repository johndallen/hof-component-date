#HOF-Component-Date

A component for handling the rendering and processing of 3-input date fields used in HOF Applications.

##Usage

fields.js
```js
const dateComponent = require('hof-component-Date');

module.exports = {
  'date-field': dateComponent('date-field', {
    validate: ['required', 'before']
  })
}
```

The above example will create a new date component with the key `'date-field'` and will apply the validators `required` and `before` (before today).

##Configuration

The following optional configuration options are supported:

* `validate {String|Array}` - validators to use on the processed date field
* `template` - an absolute path to an alternate template.

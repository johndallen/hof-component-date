'use strict';

const _ = require('lodash');
const path = require('path');
const getFields = require('./fields');

const TEMPLATE = path.resolve(__dirname, '../templates/date.html');

const getParts = (body, fields, key) =>
  _.mapKeys(_.pick(body, Object.keys(fields)), (value, fieldKey) =>
    fieldKey.replace(`${key}-`, '')
  );

const getPartsFromDate = (date, fields) =>
  date.split('-')
    .slice()
    .reverse()
    .reduce((obj, value, index) => Object.assign({}, obj, {
      [fields[index]]: value
    }), {});

const pad = num => num !== '' && num.length < 2 ? `0${num}` : num;

module.exports = (key, options) => {
  if (!key) {
    throw new Error('Key must be passed to date component');
  }
  options = options || {};
  const template = options.template ?
    path.resolve(__dirname, options.template) :
    TEMPLATE;
  const fields = getFields(key);

  let dayOptional = !!options.dayOptional;
  const monthOptional = !!options.monthOptional;

  if (monthOptional) {
    dayOptional = true;
  }

  const preGetErrors = (req, res, next) => {
    const errorValues = req.sessionModel.get('errorValues');
    if (errorValues && errorValues[key]) {
      req.sessionModel.set('errorValues',
        Object.assign({}, errorValues, getPartsFromDate(errorValues[key], Object.keys(fields)))
      );
    }
    next();
  };

  const postGetErrors = (req, res, next) => {
    const errors = req.sessionModel.get('errors');
    if (errors && errors[key]) {
      Object.assign(req.form.errors, Object.keys(fields).reduce((obj, field) =>
        Object.assign({}, obj, { [field]: { type: null } })
      , {}));
    }
    next();
  };

  const postGetValues = (req, res, next) => {
    const date = req.sessionModel.get(key);
    if (date) {
      Object.assign(
        req.form.values,
        getPartsFromDate(date, Object.keys(fields)),
        req.sessionModel.get('errorValues')
      );
    }
    next();
  };

  const preRender = (req, res, next) => {
    res.render(template, { key }, (err, html) => {
      if (err) {
        next(err);
      } else {
        const field = res.locals.fields.find(f => f.key === key);
        Object.assign(field, { html });
        next();
      }
    });
  };

  const preProcess = (req, res, next) => {
    const parts = getParts(req.body, fields, key);
    if (_.some(parts, part => part !== '')) {
      if (dayOptional && parts.day === '') {
        parts.day = '01';
      } else {
        parts.day = pad(parts.day);
      }
      if (monthOptional && parts.month === '') {
        parts.month = '01';
      } else {
        parts.month = pad(parts.month);
      }
      req.body[key] = `${parts.year}-${parts.month}-${parts.day}`;
    }
    next();
  };

  return Object.assign({}, options, {
    hooks: {
      'pre-getErrors': preGetErrors,
      'post-getErrors': postGetErrors,
      'post-getValues': postGetValues,
      'pre-render': preRender,
      'pre-process': preProcess
    }
  });
};

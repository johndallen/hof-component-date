'use strict';

const _ = require('lodash');
const path = require('path');
const moment = require('moment');
const validator = require('hof-form-controller/lib/validation');
const ErrorController = require('hof-controllers').error;
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
    throw new Error('Key must be parsed to date component');
  }
  options = options || {};
  const template = options.template ?
    path.resolve(__dirname, options.template) :
    TEMPLATE;
  const fields = getFields(key);

  const setErrorValues = (req, res, next) => {
    const errorValues = req.sessionModel.get('errorValues');
    if (errorValues && errorValues[key]) {
      req.sessionModel.set('errorValues',
        Object.assign({}, errorValues, getPartsFromDate(errorValues[key], Object.keys(fields)))
      );
    }
    next();
  };

  const getValues = (req, res, next) => {
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

  const setErrors = (req, res, next) => {
    const errors = req.sessionModel.get('errors');
    if (errors && errors[key]) {
      Object.assign(req.form.errors, Object.keys(fields).reduce((obj, field) =>
        Object.assign({}, obj, { [field]: { type: null } })
      , {}))
    }
    next();
  };

  const render = (req, res, next) => {
    res.render(template, { key }, (err, html) => {
      if (err) {
        next(err)
      } else {
        const field = res.locals.fields.find(field => field.key === key);
        Object.assign(field, { html });
        next();
      }
    });
  };

  const process = (req, res, next) => {
    const parts = getParts(req.body, fields, key);
    if(_.some(parts, part => part !== '')) {
      parts.day = pad(parts.day);
      parts.month = pad(parts.month);
      req.body[key] = `${parts.year}-${parts.month}-${parts.day}`;
    }
    next();
  };

  return Object.assign({}, options, {
    hooks: {
      'pre-getErrors': setErrorValues,
      'post-getErrors': setErrors,
      'post-getValues': getValues,
      'pre-render': render,
      'pre-process': process
    }
  });
};

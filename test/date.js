'use strict';

const path = require('path');
const reqres = require('reqres');
const dateComponent = require('../');

describe('Date Component', () => {
  let req;
  let res;

  beforeEach(() => {
    req = reqres.req();
    res = reqres.res();
  });

  it('throws an error if not called with a key', () => {
    expect(() => {
      dateComponent();
    }).to.throw();
  });

  it('extends the options passed with lifecycle hooks', () => {
    const expected = [
      'pre-getErrors',
      'post-getErrors',
      'post-getValues',
      'pre-render',
      'pre-process'
    ];
    const date = dateComponent('date-field', {
      foo: 'bar'
    });
    expect(date).to.have.property('hooks');
    expected.forEach(method => {
      expect(date.hooks).to.have.property(method).that.is.a('function');
    });
  });

  describe('GET pipeline', () => {
    let date;
    beforeEach(() => {
      req.sessionModel = {
        get: sinon.stub(),
        set: sinon.stub()
      };
      req.form = {};
      date = dateComponent('date-field');
    });

    describe('pre-getErrors', () => {
      beforeEach(() => {
        req.sessionModel.get.returns({
          'date-field': '2017-01-01'
        });
      });

      it('extends the errorValues in sessionModel with the individual field values', () => {
        date.hooks['pre-getErrors'](req, res, () => {});
        expect(req.sessionModel.get).to.have.been.calledOnce
          .and.calledWithExactly('errorValues');
        expect(req.sessionModel.set).to.have.been.calledOnce
          .and.calledWithExactly('errorValues', {
            'date-field': '2017-01-01',
            'date-field-day': '01',
            'date-field-month': '01',
            'date-field-year': '2017'
          });
      });
    });

    describe('post-getErrors', () => {
      beforeEach(() => {
        req.form.errors = { 'date-field': {} };
        req.sessionModel.get.returns({
          'date-field': {}
        });
      });

      it('adds blank errors to req.form.errors for intermedate fields', () => {
        date.hooks['post-getErrors'](req, res, () => {});
        expect(req.sessionModel.get).to.have.been.calledOnce
          .and.calledWithExactly('errors');
        expect(req.form.errors).to.be.eql({
          'date-field': {},
          'date-field-day': { type: null },
          'date-field-month': { type: null },
          'date-field-year': { type: null }
        });
      });
    });

    describe('post-getValues', () => {
      let dateValue;

      beforeEach(() => {
        dateValue = '2017-02-01';
        req.form.values = {
          'date-field': dateValue
        };
        req.sessionModel.get.withArgs('date-field').returns(dateValue);
      });

      it('extends req.form.values with the individual date parts', () => {
        date.hooks['post-getValues'](req, res, () => {});
        expect(req.form.values).to.be.eql({
          'date-field': dateValue,
          'date-field-day': '01',
          'date-field-month': '02',
          'date-field-year': '2017'
        });
      });

      it('extends with errorValues if present', () => {
        req.sessionModel.get.withArgs('errorValues').returns({
          'date-field-day': '01',
          'date-field-month': '11',
          'date-field-year': '2015'
        });
        date.hooks['post-getValues'](req, res, () => {});
        expect(req.form.values).to.be.eql({
          'date-field': dateValue,
          'date-field-day': '01',
          'date-field-month': '11',
          'date-field-year': '2015'
        });
      });
    });

    describe('pre-render', () => {
      let next;
      beforeEach(() => {
        next = sinon.stub();
        req.form.options = {
          fields: {}
        };
        req.translate = key => key;
        res.locals = {
          fields: [{
            key: 'date-field'
          }]
        };
        res.render = sinon.stub();
      });

      it('calls res.render with template and key', () => {
        date.hooks['pre-render'](req, res, next);
        expect(res.render).to.have.been.calledWith(path.resolve(__dirname, '../templates/date.html'), { key: 'date-field' });
      });

      it('calls next with an error if res.render calls callback with err', () => {
        res.render.yields('err');
        date.hooks['pre-render'](req, res, next);
        expect(next).to.have.been.calledWithExactly('err');
      });

      it('assigns the rendered html to the field if set in locals', () => {
        res.render.yields(null, 'HTML');
        date.hooks['pre-render'](req, res, next);
        expect(res.locals.fields.find(field => field.key === 'date-field')).to.have.property('html')
          .that.is.equal('HTML');
      });
    });

    describe('pre-process', () => {
      beforeEach(() => {
        req.body = {};
      });

      it('sets the date-field to the request body, made from the date parts', () => {
        req.body = {
          'date-field-day': '01',
          'date-field-month': '01',
          'date-field-year': '2017'
        };
        date.hooks['pre-process'](req, res, () => {});
        expect(req.body['date-field']).to.be.equal('2017-01-01');
      });

      it('pads month and year if less than 10', () => {
        req.body = {
          'date-field-day': '9',
          'date-field-month': '9',
          'date-field-year': '2017'
        };
        date.hooks['pre-process'](req, res, () => {});
        expect(req.body['date-field']).to.be.equal('2017-09-09');
      });

      it('doesn\t alter the request body if all fields are blank', () => {
        const body = {
          'date-field-day': '',
          'date-field-month': '',
          'date-field-year': ''
        };
        req.body = body;
        date.hooks['pre-process'](req, res, () => {});
        expect(req.body).to.be.equal(body);
      });

      it('sets the day to 01 if omitted and dayOptional is true', () => {
        date = dateComponent('date-field', {
          dayOptional: true
        });
        req.body = {
          'date-field-day': '',
          'date-field-month': '9',
          'date-field-year': '2017'
        };
        date.hooks['pre-process'](req, res, () => {});
        expect(req.body['date-field']).to.be.eql('2017-09-01');
      });

      it('sets the day and month 01 if omitted and monthOptional is true', () => {
        date = dateComponent('date-field', {
          monthOptional: true
        });
        req.body = {
          'date-field-day': '',
          'date-field-month': '',
          'date-field-year': '2017'
        };
        date.hooks['pre-process'](req, res, () => {});
        expect(req.body['date-field']).to.be.eql('2017-01-01');
      });
    });
  });
});

'use strict';

const KiteExpandInstance = require('../../lib/elements/kite-expand-instance');

describe('KiteExpandInstance', () => {
  let json, element;

  beforeEach(() => {
    json = require('../fixtures/variable.json');
    element = new KiteExpandInstance();
    element.setData(json);
  });

  it('sets the name and type of the instance', () => {
    expect(element.querySelector('.expand-header .name').textContent).toEqual('variable');
    expect(element.querySelector('.expand-header .type').textContent).toEqual('int');
  });

  it('displays the synopsis in the view summary', () => {
    expect(element.querySelector('section.summary p').textContent).toEqual('symbol `variable`');
  });
});

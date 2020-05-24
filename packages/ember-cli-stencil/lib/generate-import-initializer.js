'use strict';

const camelCase = require('lodash.camelcase');
const theredoc = require('theredoc');

function generateInitializer(moduleConfigs) {
  const modules = moduleConfigs.map(({ name, importOptions = {} }) => ({
    name,
    polyfillFunction: camelCase(`apply-polyfills-${name}`),
    importFunction: camelCase(`define-${name}`),
    importOptions
  }));

  const moduleImports = modules
    .map(
      ({ name, polyfillFunction, importFunction }) =>
        theredoc`
          import {
            applyPolyfills as ${polyfillFunction},
            defineCustomElements as ${importFunction}
          } from '${name}/loader';
        `
    )
    .reduce(
      (acc, importStatement) =>
        acc + (acc === '' ? '' : '\n') + importStatement,
      ''
    );

  const defineComponents = modules.reduce(
    (acc, { polyfillFunction, importFunction, importOptions }) =>
      acc +
      (acc === '' ? '' : '\n') +
      theredoc`
        ${polyfillFunction}().then(function() {
          ${importFunction}(window, ${JSON.stringify(importOptions)});
        });
      `,
    ''
  );

  const initializer = theredoc`
    export function initialize() {
      // No-op
    };

    export default {
      initialize
    };
  `;

  return moduleImports + '\n\n' + defineComponents + '\n\n' + initializer;
}

module.exports = generateInitializer;

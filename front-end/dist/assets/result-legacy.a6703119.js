;
(function () {
  System.register(['./define-legacy.db730405.js', './index-legacy.6fdf06ff.js', './config-legacy.5a1aa35d.js', './modulepreload-polyfill-legacy.8dcb0a50.js'], function (exports, module) {
    'use strict';

    var define, globalBus;
    return {
      setters: [module => {
        define = module.d;
      }, module => {
        globalBus = module.g;
      }, () => {}, () => {}],
      execute: function () {
        const result = exports('default', define('result', class extends HTMLLIElement {
          constructor() {
            super();
            this.classList.add('result');
            this.__setup();
          }
          __setup() {
            this.__events();
          }
          __events() {
            this.addEventListener('keydown', e => {
              if (this.firstElementChild === document.activeElement) {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  this?.nextElementSibling?.firstElementChild.focus();
                }
                if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  if (this.previousElementSibling) this.previousElementSibling?.firstElementChild.focus();else {
                    const focusSearchEvent = new CustomEvent('focus-search');
                    globalBus.dispatch(focusSearchEvent);
                  }
                }
              }
            });
          }
        }, {
          extends: 'li'
        }));
      }
    };
  });
})();

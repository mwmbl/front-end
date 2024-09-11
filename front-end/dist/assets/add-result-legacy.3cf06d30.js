;
(function () {
  System.register(['./define-legacy.db730405.js', './index-legacy.6fdf06ff.js', './config-legacy.5a1aa35d.js', './modulepreload-polyfill-legacy.8dcb0a50.js'], function (exports, module) {
    'use strict';

    var define;
    return {
      setters: [module => {
        define = module.d;
      }, () => {}, () => {}, () => {}],
      execute: function () {
        const addResult = exports('default', define('add-result', class extends HTMLDivElement {
          connectedCallback() {
            this.classList.add('modal');
            this.__setup();
          }
          __setup() {
            this.__events();
            this.style.display = 'none';
          }
          __events() {
            this.querySelector('.close').addEventListener('click', e => {
              this.style.display = 'none';
            });
            this.addEventListener('click', e => {
              this.style.display = 'none';
            });
            this.querySelector('form').addEventListener('click', e => {
              // Clicking on the form shouldn't close it
              e.stopPropagation();
            });
          }
        }, {
          extends: 'div'
        }));
      }
    };
  });
})();

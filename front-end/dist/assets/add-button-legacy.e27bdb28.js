;
(function () {
  System.register(['./define-legacy.db730405.js', './config-legacy.5a1aa35d.js'], function (exports, module) {
    'use strict';

    var define;
    return {
      setters: [module => {
        define = module.d;
      }, () => {}],
      execute: function () {
        const addButton = exports('default', define('add-button', class extends HTMLButtonElement {
          constructor() {
            super();
            this.__setup();
          }
          __setup() {
            this.__events();
          }
          __events() {
            this.addEventListener('click', e => {
              console.log("Add button");
              document.querySelector('.modal').style.display = 'block';
              document.querySelector('.modal input').focus();
            });
          }
        }, {
          extends: 'button'
        }));
      }
    };
  });
})();

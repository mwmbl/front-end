;
(function () {
  System.register([], function (exports, module) {
    'use strict';

    return {
      execute: function () {
        false && function polyfill() {
          const relList = document.createElement('link').relList;
          if (relList && relList.supports && relList.supports('modulepreload')) {
            return;
          }
          for (const link of document.querySelectorAll('link[rel="modulepreload"]')) {
            processPreload(link);
          }
          new MutationObserver(mutations => {
            for (const mutation of mutations) {
              if (mutation.type !== 'childList') {
                continue;
              }
              for (const node of mutation.addedNodes) {
                if (node.tagName === 'LINK' && node.rel === 'modulepreload') processPreload(node);
              }
            }
          }).observe(document, {
            childList: true,
            subtree: true
          });
          function getFetchOpts(script) {
            const fetchOpts = {};
            if (script.integrity) fetchOpts.integrity = script.integrity;
            if (script.referrerpolicy) fetchOpts.referrerPolicy = script.referrerpolicy;
            if (script.crossorigin === 'use-credentials') fetchOpts.credentials = 'include';else if (script.crossorigin === 'anonymous') fetchOpts.credentials = 'omit';else fetchOpts.credentials = 'same-origin';
            return fetchOpts;
          }
          function processPreload(link) {
            if (link.ep)
              // ep marker = processed
              return;
            link.ep = true;
            // prepopulate the load record
            const fetchOpts = getFetchOpts(link);
            fetch(link.href, fetchOpts);
          }
        }();
      }
    };
  });
})();

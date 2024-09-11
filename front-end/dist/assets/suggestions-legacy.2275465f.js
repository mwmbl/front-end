;
(function () {
  System.register(['./config-legacy.5a1aa35d.js'], function (exports, module) {
    'use strict';

    var config;
    return {
      setters: [module => {
        config = module.c;
      }],
      execute: function () {
        /**
         * Handle redirect requests from the suggestion back-end.
         */

        const redirectToSuggestions = exports('redirectToSuggestions', () => {
          const search = decodeURIComponent(document.location.search).replace(/\+/g, ' ').substr(3);
          console.log("Search", search);
          for (const [command, urlTemplate] of Object.entries(config.commands)) {
            console.log("Command", command);
            if (search.startsWith(command)) {
              const newUrl = urlTemplate + search.substr(command.length);
              window.location.replace(newUrl);
              return true;
            }
          }
          return false;
        });
      }
    };
  });
})();

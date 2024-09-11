import { d as define } from "./define.364a5835.js";
import { g as globalBus } from "./index.7fcade45.js";
import "./config.4d6779e6.js";
import "./modulepreload-polyfill.c7c6310f.js";
const result = define("result", class extends HTMLLIElement {
  constructor() {
    super();
    this.classList.add("result");
    this.__setup();
  }
  __setup() {
    this.__events();
  }
  __events() {
    this.addEventListener("keydown", (e) => {
      var _a, _b;
      if (this.firstElementChild === document.activeElement) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          (_a = this == null ? void 0 : this.nextElementSibling) == null ? void 0 : _a.firstElementChild.focus();
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          if (this.previousElementSibling)
            (_b = this.previousElementSibling) == null ? void 0 : _b.firstElementChild.focus();
          else {
            const focusSearchEvent = new CustomEvent("focus-search");
            globalBus.dispatch(focusSearchEvent);
          }
        }
      }
    });
  }
}, { extends: "li" });
export {
  result as default
};

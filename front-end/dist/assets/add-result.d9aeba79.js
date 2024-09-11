import { d as define } from "./define.364a5835.js";
import "./index.7fcade45.js";
import "./config.4d6779e6.js";
import "./modulepreload-polyfill.c7c6310f.js";
const addResult = define("add-result", class extends HTMLDivElement {
  connectedCallback() {
    this.classList.add("modal");
    this.__setup();
  }
  __setup() {
    this.__events();
    this.style.display = "none";
  }
  __events() {
    this.querySelector(".close").addEventListener("click", (e) => {
      this.style.display = "none";
    });
    this.addEventListener("click", (e) => {
      this.style.display = "none";
    });
    this.querySelector("form").addEventListener("click", (e) => {
      e.stopPropagation();
    });
  }
}, { extends: "div" });
export {
  addResult as default
};

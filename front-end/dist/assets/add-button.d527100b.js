import { d as define } from "./define.364a5835.js";
import "./config.4d6779e6.js";
const addButton = define("add-button", class extends HTMLButtonElement {
  constructor() {
    super();
    this.__setup();
  }
  __setup() {
    this.__events();
  }
  __events() {
    this.addEventListener("click", (e) => {
      console.log("Add button");
      document.querySelector(".modal").style.display = "block";
      document.querySelector(".modal input").focus();
    });
  }
}, { extends: "button" });
export {
  addButton as default
};

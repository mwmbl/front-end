import { c as config } from "./config.4d6779e6.js";
const define = (name, constructor, options) => {
  const componentName = `${config.componentPrefix}-${name}`;
  if (!customElements.get(componentName))
    customElements.define(componentName, constructor, options);
  return componentName;
};
export {
  define as d
};

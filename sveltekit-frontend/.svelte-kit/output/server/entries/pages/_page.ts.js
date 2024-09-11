import { r as redirect } from "../../chunks/index.js";
async function load({ url }) {
  const query = url.searchParams.get("q");
  if (url.searchParams.get("q") != null) {
    redirect(303, "/search?q=" + query);
  }
}
export {
  load
};

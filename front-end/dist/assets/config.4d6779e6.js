const config = {
  componentPrefix: "mwmbl",
  publicApiURL: "/api/v1/",
  searchQueryParam: "q",
  commands: {
    "go: ": "https://",
    "search: google.com ": "https://www.google.com/search?q="
  }
};
export {
  config as c
};

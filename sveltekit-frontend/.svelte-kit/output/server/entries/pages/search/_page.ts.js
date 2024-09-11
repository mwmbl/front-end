async function load({ url }) {
  const response = await fetch("https://mwmbl.org/search/?s=" + url.searchParams.get("q"));
  const results = await response.json();
  return {
    query: url.searchParams.get("q"),
    results
  };
}
export {
  load
};

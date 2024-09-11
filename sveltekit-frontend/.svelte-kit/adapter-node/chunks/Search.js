import { n as rest_props, j as fallback, q as spread_attributes, m as bind_props, f as pop, t as sanitize_props, p as push, k as slot, z as copy_payload, A as assign_payload, w as ensure_array_like, C as stringify, y as escape_html } from "./index3.js";
import { l as cn, j as default_slot, B as Button } from "./index4.js";
import "clsx";
function Input($$payload, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const $$restProps = rest_props($$sanitized_props, ["class", "value", "readonly"]);
  push();
  let className = fallback($$props["class"], void 0);
  let value = fallback($$props["value"], void 0);
  let readonly = fallback($$props["readonly"], void 0);
  $$payload.out += `<input${spread_attributes({
    class: cn("flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", className),
    value,
    readonly,
    ...$$restProps
  })}>`;
  bind_props($$props, { class: className, value, readonly });
  pop();
}
function Card($$payload, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const $$restProps = rest_props($$sanitized_props, ["class"]);
  push();
  let className = fallback($$props["class"], void 0);
  $$payload.out += `<div${spread_attributes({
    class: cn("rounded-lg border bg-card text-card-foreground shadow-sm", className),
    ...$$restProps
  })}><!---->`;
  slot($$payload, default_slot($$props), {});
  $$payload.out += `<!----></div>`;
  bind_props($$props, { class: className });
  pop();
}
function Magnifying_glass($$payload, $$props) {
  const { ...p } = $$props;
  $$payload.out += `<svg${spread_attributes(
    {
      viewBox: "0 0 256 256",
      width: "1.2em",
      height: "1.2em",
      ...p
    },
    void 0,
    void 0,
    3
  )}><path fill="currentColor" d="m229.66 218.34l-50.07-50.06a88.11 88.11 0 1 0-11.31 11.31l50.06 50.07a8 8 0 0 0 11.32-11.32M40 112a72 72 0 1 1 72 72a72.08 72.08 0 0 1-72-72"></path></svg>`;
}
function Arrow_square_out_fill($$payload, $$props) {
  const { ...p } = $$props;
  $$payload.out += `<svg${spread_attributes(
    {
      viewBox: "0 0 256 256",
      width: "1.2em",
      height: "1.2em",
      ...p
    },
    void 0,
    void 0,
    3
  )}><path fill="currentColor" d="M192 136v72a16 16 0 0 1-16 16H48a16 16 0 0 1-16-16V80a16 16 0 0 1 16-16h72a8 8 0 0 1 0 16H48v128h128v-72a8 8 0 0 1 16 0m32-96a8 8 0 0 0-8-8h-64a8 8 0 0 0-5.66 13.66L172.69 72l-42.35 42.34a8 8 0 0 0 11.32 11.32L184 83.31l26.34 26.35A8 8 0 0 0 224 104Z"></path></svg>`;
}
function Close_rounded($$payload, $$props) {
  const { ...p } = $$props;
  $$payload.out += `<svg${spread_attributes(
    {
      viewBox: "0 0 24 24",
      width: "1.2em",
      height: "1.2em",
      ...p
    },
    void 0,
    void 0,
    3
  )}><path fill="currentColor" d="m12 13.4l-4.9 4.9q-.275.275-.7.275t-.7-.275t-.275-.7t.275-.7l4.9-4.9l-4.9-4.9q-.275-.275-.275-.7t.275-.7t.7-.275t.7.275l4.9 4.9l4.9-4.9q.275-.275.7-.275t.7.275t.275.7t-.275.7L13.4 12l4.9 4.9q.275.275.275.7t-.275.7t-.7.275t-.7-.275z"></path></svg>`;
}
function Search($$payload, $$props) {
  push();
  let { query } = $$props;
  let searchCompletions = [];
  let completionsExist = searchCompletions.length > 0 && searchCompletions[0] !== "search: google.com ";
  let $$settled = true;
  let $$inner_payload;
  function $$render_inner($$payload2) {
    $$payload2.out += `<form class="relative flex w-full max-w-[46rem] flex-row items-center px-4" action="/search" method="get">`;
    Input($$payload2, {
      type: "search",
      name: "q",
      placeholder: "Search with Mwmbl...",
      class: "rounded-lg p-6 text-lg" + (completionsExist ? " rounded-b-none border-b-0" : ""),
      get value() {
        return query;
      },
      set value($$value) {
        query = $$value;
        $$settled = false;
      }
    });
    $$payload2.out += `<!----> `;
    Button($$payload2, {
      tabindex: -1,
      type: "submit",
      class: "absolute right-6 h-8 w-8 rounded-full bg-pink-300",
      children: ($$payload3) => {
        Magnifying_glass($$payload3, { class: "min-h-5 min-w-5 text-black" });
      },
      $$slots: { default: true }
    });
    $$payload2.out += `<!----> <!---->`;
    Card($$payload2, {
      class: "absolute top-12 flex w-[calc(100%-2rem)] rounded-t-none border-t-0" + (completionsExist ? " px-4 pb-4 pt-2" : ""),
      children: ($$payload3) => {
        $$payload3.out += `<ol>`;
        if (completionsExist) {
          $$payload3.out += "<!--[-->";
          const each_array = ensure_array_like(searchCompletions);
          $$payload3.out += `<!--[-->`;
          for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
            const completion = each_array[$$index];
            if (!completion.match(/^.*: /)) {
              $$payload3.out += "<!--[-->";
              Button($$payload3, {
                variant: "link",
                href: `/search?q=${stringify(completion)}`,
                children: ($$payload4) => {
                  $$payload4.out += `<!---->${escape_html(completion)}`;
                },
                $$slots: { default: true }
              });
            } else {
              $$payload3.out += "<!--[!-->";
              if (completion.startsWith("search: google.com ")) {
                $$payload3.out += "<!--[-->";
                Button($$payload3, {
                  variant: "outline",
                  target: "_blank",
                  href: `https://google.com/search?q=${stringify(completion.replace(/^search: google\.com/, ""))}`,
                  children: ($$payload4) => {
                    $$payload4.out += `<span>Search on Google: ${escape_html(completion.replace(/^search: google\.com/, ""))}</span> `;
                    Magnifying_glass($$payload4, { class: "ml-1 min-h-5 min-w-5 text-black" });
                    $$payload4.out += `<!---->`;
                  },
                  $$slots: { default: true }
                });
              } else {
                $$payload3.out += "<!--[!-->";
                if (completion.startsWith("go: ")) {
                  $$payload3.out += "<!--[-->";
                  Button($$payload3, {
                    variant: "outline",
                    href: "https://" + completion.replace(/^go: /, ""),
                    children: ($$payload4) => {
                      $$payload4.out += `<span>Open website: ${escape_html(completion.replace(/^go: /, ""))}</span> `;
                      Arrow_square_out_fill($$payload4, { class: "ml-1 min-h-5 min-w-5 text-black" });
                      $$payload4.out += `<!---->`;
                    },
                    $$slots: { default: true }
                  });
                } else {
                  $$payload3.out += "<!--[!-->";
                }
                $$payload3.out += `<!--]-->`;
              }
              $$payload3.out += `<!--]-->`;
            }
            $$payload3.out += `<!--]-->`;
          }
          $$payload3.out += `<!--]-->`;
        } else {
          $$payload3.out += "<!--[!-->";
        }
        $$payload3.out += `<!--]--></ol> `;
        if (completionsExist) {
          $$payload3.out += "<!--[-->";
          Button($$payload3, {
            variant: "outline",
            size: "icon",
            class: "ml-auto",
            children: ($$payload4) => {
              Close_rounded($$payload4, { class: "min-h-5 min-w-5 text-black" });
            },
            $$slots: { default: true }
          });
        } else {
          $$payload3.out += "<!--[!-->";
        }
        $$payload3.out += `<!--]-->`;
      },
      $$slots: { default: true }
    });
    $$payload2.out += `<!----></form>`;
  }
  do {
    $$settled = true;
    $$inner_payload = copy_payload($$payload);
    $$render_inner($$inner_payload);
  } while (!$$settled);
  assign_payload($$payload, $$inner_payload);
  pop();
}
export {
  Card as C,
  Search as S
};

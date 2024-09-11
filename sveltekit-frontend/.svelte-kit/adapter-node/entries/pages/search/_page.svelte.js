import { n as rest_props, j as fallback, l as store_get, k as slot, q as spread_attributes, u as unsubscribe_stores, m as bind_props, f as pop, t as sanitize_props, p as push, o as element, v as spread_props, z as copy_payload, A as assign_payload, w as ensure_array_like, B as attr, y as escape_html } from "../../../chunks/index3.js";
import { S as Search, C as Card } from "../../../chunks/Search.js";
import "clsx";
import { m as makeElement, d as addMeltEventListener, j as default_slot, l as cn } from "../../../chunks/index4.js";
import { c as createBitAttrs } from "../../../chunks/attrs.js";
function createLabel() {
  const root = makeElement("label", {
    action: (node) => {
      const mouseDown = addMeltEventListener(node, "mousedown", (e) => {
        if (!e.defaultPrevented && e.detail > 1) {
          e.preventDefault();
        }
      });
      return {
        destroy: mouseDown
      };
    }
  });
  return {
    elements: {
      root
    }
  };
}
function getLabelData() {
  const NAME = "label";
  const PARTS = ["root"];
  const getAttrs = createBitAttrs(NAME, PARTS);
  return {
    NAME,
    getAttrs
  };
}
function Label$1($$payload, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const $$restProps = rest_props($$sanitized_props, ["asChild", "el"]);
  push();
  var $$store_subs;
  let builder;
  let asChild = fallback($$props["asChild"], false);
  let el = fallback($$props["el"], () => void 0, true);
  const { elements: { root } } = createLabel();
  const { getAttrs } = getLabelData();
  const attrs = getAttrs("root");
  builder = store_get($$store_subs ??= {}, "$root", root);
  Object.assign(builder, attrs);
  if (asChild) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<!---->`;
    slot($$payload, default_slot($$props), { builder });
    $$payload.out += `<!---->`;
  } else {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<label${spread_attributes({ ...builder, ...$$restProps })}><!---->`;
    slot($$payload, default_slot($$props), { builder });
    $$payload.out += `<!----></label>`;
  }
  $$payload.out += `<!--]-->`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  bind_props($$props, { asChild, el });
  pop();
}
function Card_description($$payload, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const $$restProps = rest_props($$sanitized_props, ["class"]);
  push();
  let className = fallback($$props["class"], void 0);
  $$payload.out += `<p${spread_attributes({
    class: cn("text-sm text-muted-foreground", className),
    ...$$restProps
  })}><!---->`;
  slot($$payload, default_slot($$props), {});
  $$payload.out += `<!----></p>`;
  bind_props($$props, { class: className });
  pop();
}
function Card_title($$payload, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const $$restProps = rest_props($$sanitized_props, ["class", "tag"]);
  push();
  let className = fallback($$props["class"], void 0);
  let tag = fallback($$props["tag"], "h3");
  element(
    $$payload,
    tag,
    () => {
      $$payload.out += `${spread_attributes({
        class: cn("text-lg font-semibold leading-none tracking-tight", className),
        ...$$restProps
      })}`;
    },
    () => {
      $$payload.out += `<!---->`;
      slot($$payload, default_slot($$props), {});
      $$payload.out += `<!---->`;
    }
  );
  bind_props($$props, { class: className, tag });
  pop();
}
function Label($$payload, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const $$restProps = rest_props($$sanitized_props, ["class"]);
  push();
  let className = fallback($$props["class"], void 0);
  Label$1($$payload, spread_props([
    {
      class: cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)
    },
    $$restProps,
    {
      children: ($$payload2) => {
        $$payload2.out += `<!---->`;
        slot($$payload2, default_slot($$props), {});
        $$payload2.out += `<!---->`;
      },
      $$slots: { default: true }
    }
  ]));
  bind_props($$props, { class: className });
  pop();
}
function Skeleton($$payload, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const $$restProps = rest_props($$sanitized_props, ["class"]);
  push();
  let className = fallback($$props["class"], void 0);
  $$payload.out += `<div${spread_attributes({
    class: cn("bg-muted animate-pulse rounded-md", className),
    ...$$restProps
  })}></div>`;
  bind_props($$props, { class: className });
  pop();
}
function _page($$payload, $$props) {
  push();
  let { data } = $$props;
  let $$settled = true;
  let $$inner_payload;
  function $$render_inner($$payload2) {
    const each_array = ensure_array_like(data.results);
    $$payload2.out += `<main class="flex flex-col items-center gap-8 svelte-13r1krg">`;
    Search($$payload2, { query: data.query });
    $$payload2.out += `<!----> <div class="flex flex-row items-center justify-start gap-3 max-w-2xl w-full px-4 svelte-13r1krg">`;
    {
      $$payload2.out += "<!--[-->";
      Skeleton($$payload2, {
        class: "h-[24px] w-[44px] rounded-full bg-input"
      });
    }
    $$payload2.out += `<!--]--> `;
    Label($$payload2, {
      for: "newtab-switch",
      children: ($$payload3) => {
        $$payload3.out += `<!---->Open results in new tab`;
      },
      $$slots: { default: true }
    });
    $$payload2.out += `<!----></div> <div class="flex max-w-2xl flex-col gap-4 px-4 svelte-13r1krg"><!--[-->`;
    for (let $$index_2 = 0, $$length = each_array.length; $$index_2 < $$length; $$index_2++) {
      const result = each_array[$$index_2];
      $$payload2.out += `<a${attr("href", result.url)} class="group svelte-13r1krg"${attr("target", "_self")}><!---->`;
      Card($$payload2, {
        class: "flex flex-col gap-2 p-4",
        children: ($$payload3) => {
          $$payload3.out += `<div class="group-hover:underline svelte-13r1krg">${escape_html(result.url)} <span class="italic svelte-13r1krg">—found via ${escape_html(result.source)}</span></div> <!---->`;
          Card_title($$payload3, {
            class: "font-medium",
            children: ($$payload4) => {
              const each_array_1 = ensure_array_like(result.title);
              $$payload4.out += `<!--[-->`;
              for (let $$index = 0, $$length2 = each_array_1.length; $$index < $$length2; $$index++) {
                const titleSegment = each_array_1[$$index];
                if (titleSegment.is_bold) {
                  $$payload4.out += "<!--[-->";
                  $$payload4.out += `<strong class="svelte-13r1krg">${escape_html(titleSegment.value)}</strong>`;
                } else {
                  $$payload4.out += "<!--[!-->";
                  $$payload4.out += `${escape_html(titleSegment.value)}`;
                }
                $$payload4.out += `<!--]-->`;
              }
              $$payload4.out += `<!--]-->`;
            },
            $$slots: { default: true }
          });
          $$payload3.out += `<!----> <!---->`;
          Card_description($$payload3, {
            children: ($$payload4) => {
              const each_array_2 = ensure_array_like(result.extract);
              $$payload4.out += `<!--[-->`;
              for (let $$index_1 = 0, $$length2 = each_array_2.length; $$index_1 < $$length2; $$index_1++) {
                const extractSegment = each_array_2[$$index_1];
                if (extractSegment.is_bold) {
                  $$payload4.out += "<!--[-->";
                  $$payload4.out += `<strong class="svelte-13r1krg">${escape_html(extractSegment.value)}</strong>`;
                } else {
                  $$payload4.out += "<!--[!-->";
                  $$payload4.out += `${escape_html(extractSegment.value)}`;
                }
                $$payload4.out += `<!--]-->`;
              }
              $$payload4.out += `<!--]-->`;
            },
            $$slots: { default: true }
          });
          $$payload3.out += `<!---->`;
        },
        $$slots: { default: true }
      });
      $$payload2.out += `<!----></a>`;
    }
    $$payload2.out += `<!--]--></div></main>`;
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
  _page as default
};

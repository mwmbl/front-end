import{s as o}from"./index.-Uhmylzt.js";import{t as c,m as f,n as i,g as b,s as a}from"./runtime.DgZE306K.js";function p(u,e,r){const s=r[e]??(r[e]={store:null,source:f(void 0),unsubscribe:i});if(s.store!==u)if(s.unsubscribe(),s.store=u??null,u==null)s.source.v=void 0,s.unsubscribe=i;else{var n=!0;s.unsubscribe=o(u,t=>{n?s.source.v=t:a(s.source,t)}),n=!1}return b(s.source)}function g(){const u={};return c(()=>{for(var e in u)u[e].unsubscribe()}),u}export{p as a,g as s};
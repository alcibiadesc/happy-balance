import"./DsnmJJEf.js";import"./B6xteeIL.js";import{m as y,n as v,o as S,w as m,v as o}from"./J53a5pXB.js";import{s as w}from"./CORCjSxP.js";import{l as E,s as P}from"./CVWE5XDX.js";import{I as T}from"./D9OV0qr6.js";function O(e,a){const c=E(a,["children","$$slots","$$events","$$legacy"]);/**
 * @license lucide-svelte v0.542.0 - ISC
 *
 * ISC License
 *
 * Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2023 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2025.
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 *
 * ---
 *
 * The MIT License (MIT) (for portions derived from Feather)
 *
 * Copyright (c) 2013-2023 Cole Bemis
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 */const t=[["path",{d:"M12 3v12"}],["path",{d:"m17 8-5-5-5 5"}],["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"}]];T(e,P({name:"upload"},()=>c,{get iconNode(){return t},children:(s,r)=>{var n=y(),g=v(n);w(g,a,"default",{},null),S(s,n)},$$slots:{default:!0}}))}function u(){return window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}function f(){const e=localStorage.getItem("theme");return e==="light"||e==="dark"||e==="system"?e:"system"}const p=m(f()),U=o(p,e=>e==="system"?u():e);function A(e){p.set(e),h(e)}function h(e){(e==="system"?u():e)==="dark"?(document.documentElement.classList.add("dark"),document.documentElement.setAttribute("data-theme","dark")):(document.documentElement.classList.remove("dark"),document.documentElement.setAttribute("data-theme","light"))}window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",e=>{f()==="system"&&h("system")});const d="http://localhost:3008/api",l={userId:"default",currency:"EUR",language:"en",theme:"light"};function k(){const{subscribe:e,set:a,update:c}=m(l);return{subscribe:e,async load(){try{const t=await fetch(`${d}/preferences/default`);if(t.ok){const s=await t.json();a(s),localStorage.setItem("userPreferences",JSON.stringify(s))}else{const s=localStorage.getItem("userPreferences");if(s){const r=JSON.parse(s);a(r)}else await this.save(l)}}catch{console.warn("Failed to load preferences from database, using localStorage fallback");const s=localStorage.getItem("userPreferences");if(s){const r=JSON.parse(s);a(r)}}},async save(t){try{const s=await fetch(`${d}/preferences/default`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(t)});if(s.ok){const r=await s.json();a(r),localStorage.setItem("userPreferences",JSON.stringify(r))}else throw new Error("Failed to save to database")}catch{console.warn("Failed to save preferences to database, updating localStorage only"),c(r=>{const n={...r,...t};return localStorage.setItem("userPreferences",JSON.stringify(n)),n})}},async updateCurrency(t){await this.save({currency:t})},async updateLanguage(t){await this.save({language:t})},async updateTheme(t){await this.save({theme:t})}}}const i=k();o(i,e=>e.currency);o(i,e=>e.language);o(i,e=>e.theme);export{O as U,h as a,U as e,A as s,p as t,i as u};

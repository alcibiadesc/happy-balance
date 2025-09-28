import"./DsnmJJEf.js";import"./B6xteeIL.js";import{m as D,n as E,o as T,M as ve,R as g,T as de,U as m,O as _e,D as h,$ as ue,V as x,W as y,H as be,I as a,J as n,P as f,N as pe,Q as C,C as k}from"./J53a5pXB.js";import{l as ge,s as he,p as r,i as B,a as xe,b as ye}from"./CVWE5XDX.js";import{t as Ce,s as q}from"./DwDLloZq.js";import{i as ke}from"./Ce3FM-Or.js";import{I as Te,X as we}from"./D9OV0qr6.js";import{s as Me}from"./CORCjSxP.js";import{C as ze}from"./Cd9j2BcX.js";function F(w,e){const t=ge(e,["children","$$slots","$$events","$$legacy"]);/**
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
 */const M=[["path",{d:"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"}],["path",{d:"M12 9v4"}],["path",{d:"M12 17h.01"}]];Te(w,he({name:"triangle-alert"},()=>t,{get iconNode(){return M},children:(z,I)=>{var i=D(),v=E(i);Me(v,e,"default",{},null),T(z,i)},$$slots:{default:!0}}))}var Ie=be('<div class="modal modal-open svelte-mrlnh3" role="dialog"><div class="modal-box relative max-w-md svelte-mrlnh3"><button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 svelte-mrlnh3"><!></button> <div class="flex justify-center mb-4 svelte-mrlnh3"><div><!></div></div> <h3 class="font-bold text-lg text-center mb-2 svelte-mrlnh3"> </h3> <p class="text-center text-base-content/80 mb-6 svelte-mrlnh3"> </p> <div class="modal-action flex gap-3 justify-center svelte-mrlnh3"><button class="btn btn-outline svelte-mrlnh3"> </button> <button> </button></div></div></div>');function Je(w,e){ve(e,!1);const t=()=>ye(Ce,"$t",M),[M,z]=xe(),I=y(),i=y(),v=y(),H=y();let N=r(e,"isOpen",12,!1),J=r(e,"title",8,""),K=r(e,"message",8,""),Q=r(e,"confirmText",8,""),R=r(e,"cancelText",8,""),c=r(e,"type",8,"warning"),G=r(e,"onConfirm",8,()=>{}),L=r(e,"onCancel",8,()=>{});function d(){N(!1),L()()}function S(){G()(),N(!1)}function Y(s){s.target===s.currentTarget&&d()}function Z(s){s.key==="Escape"&&d()}g(()=>(h(J()),t()),()=>{x(I,J()||t()("modal.confirm_action"))}),g(()=>(h(K()),t()),()=>{x(i,K()||t()("modal.are_you_sure"))}),g(()=>(h(Q()),t()),()=>{x(v,Q()||t()("common.confirm"))}),g(()=>(h(R()),t()),()=>{x(H,R()||t()("common.cancel"))}),de(),ke();var U=D();m("keydown",ue,Z);var $=E(U);{var ee=s=>{var _=Ie(),V=a(_),u=a(V),te=a(u);we(te,{size:18}),n(u);var O=f(u,2),j=a(O),ae=a(j);{var ne=l=>{F(l,{size:32})},se=l=>{var X=D(),ce=E(X);{var me=o=>{F(o,{size:32})},fe=o=>{ze(o,{size:32})};B(ce,o=>{c()==="warning"?o(me):o(fe,!1)},!0)}T(l,X)};B(ae,l=>{c()==="danger"?l(ne):l(se,!1)})}n(j),n(O);var P=f(O,2),re=a(P,!0);n(P);var A=f(P,2),le=a(A,!0);n(A);var W=f(A,2),b=a(W),oe=a(b,!0);n(b);var p=f(b,2),ie=a(p,!0);n(p),n(W),n(V),n(_),pe(()=>{q(j,1,`icon-container ${c()??""}`,"svelte-mrlnh3"),C(re,k(I)),C(le,k(i)),C(oe,k(H)),q(p,1,`btn ${c()==="danger"?"btn-error":c()==="warning"?"btn-warning":"btn-primary"}`,"svelte-mrlnh3"),C(ie,k(v))}),m("click",u,d),m("click",b,d),m("click",p,S),m("click",_,Y),T(s,_)};B($,s=>{N()&&s(ee)})}T(w,U),_e(),z()}export{Je as C};

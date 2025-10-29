// أدوات بسيطة مشتركة
export const qs  = (sel, el=document)=> el.querySelector(sel);
export const qsa = (sel, el=document)=> [...el.querySelectorAll(sel)];
export const byId = (id)=> document.getElementById(id);

export const debounce = (fn, ms=250)=>{
  let t; return (...args)=>{ clearTimeout(t); t=setTimeout(()=>fn(...args), ms); };
};

export const norm = (s)=> (s||"").toString().toLowerCase();


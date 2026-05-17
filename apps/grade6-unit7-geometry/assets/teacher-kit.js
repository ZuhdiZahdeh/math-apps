
const search = document.getElementById('search');
const lessonCards = [...document.querySelectorAll('.lesson-card')];
function norm(s){return String(s||'').replace(/[\u064B-\u065F]/g,'').replace(/أ|إ|آ/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي').toLowerCase();}
if(search){search.addEventListener('input',()=>{const q=norm(search.value);lessonCards.forEach(card=>card.classList.toggle('hidden', q && !norm(card.dataset.search).includes(q)));});}
function copyLink(path){
  const url = new URL(path, location.href).href;
  navigator.clipboard?.writeText(url).then(()=>alert('تم نسخ الرابط:\n'+url)).catch(()=>prompt('انسخ الرابط:', url));
}
function printSection(id){
  const el = document.getElementById(id);
  if(!el){window.print();return;}
  document.body.dataset.printOnly = id;
  window.print();
}

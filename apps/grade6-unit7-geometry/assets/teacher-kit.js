
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

function openPdf(path, title){
  const viewer = document.getElementById('pdf-viewer');
  const frame = document.getElementById('pdfFrame');
  const titleEl = document.getElementById('pdfTitle');
  const openEl = document.getElementById('pdfOpen');
  const downloadEl = document.getElementById('pdfDownload');
  const copyEl = document.getElementById('pdfCopy');
  if(!frame || !titleEl || !openEl || !downloadEl){
    window.open(path, '_blank', 'noopener');
    return;
  }
  titleEl.textContent = title || 'ملف PDF';
  frame.src = path + '#view=FitH';
  openEl.href = path;
  downloadEl.href = path;
  if(copyEl){ copyEl.setAttribute('onclick', "copyLink('" + path.replace(/'/g,"\\'") + "')"); }
  document.querySelectorAll('.pdf-item').forEach(btn => btn.classList.toggle('active', btn.dataset.pdf === path));
  viewer?.scrollIntoView({behavior:'smooth', block:'start'});
}

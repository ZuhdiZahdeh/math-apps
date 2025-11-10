(function(){
const P=card.querySelector('[data-role="P"]').value; const A=card.querySelector('[data-role="A"]').value;
const pAns=card.querySelector('[data-ansP]').value; const aAns=card.querySelector('[data-ansA]').value;
const okP=P===pAns, okA=A===aAns; if(okP&&okA){card.style.outline='2px solid #10b981'; correct+=2;} else if(okP||okA){card.style.outline='2px dashed #f59e0b'; correct+=1;} else{card.style.outline='2px solid #ef4444';}
}); $('#triScore').textContent=`النتيجة: ${correct}/${total}`;
});
$('#shuffleTri').addEventListener('click',()=>{renderTri(); $('#triScore').textContent='';});


// امتحان محوسب
function norm(v){return (v||'').toString().trim().replace(/\s+/g,'').replace('،',',');}
$('#gradeQuiz').addEventListener('click',()=>{
const qs=$$('#quizForm .q'); let score=0,total=qs.length; qs.forEach(q=>{
q.classList.remove('correct','incorrect'); const fb=q.querySelector('.feedback'); fb.textContent=''; const type=q.dataset.type;
if(type==='mc'){ const correct=q.dataset.correct; const val=(q.querySelector('input[type="radio"]:checked')||{}).value||''; if(val===correct){score++; q.classList.add('correct'); fb.textContent='صحيح'; fb.style.color='#10b981';} else {q.classList.add('incorrect'); fb.textContent='تحقّق من التعريف/الوحدة.'; fb.style.color='#ef4444';}}
if(type==='input'){ const ans=norm(q.dataset.correct); const val=norm(q.querySelector('input').value); if(ans.includes(',')){ const [a1,a2]=ans.split(','); const [v1,v2]=val.split(','); if(v1===a1&&v2===a2){score++; q.classList.add('correct'); fb.textContent='صحيح'; fb.style.color='#10b981';} else {q.classList.add('incorrect'); fb.textContent='المحيط أولًا ثم المساحة بالوحدة الصحيحة.'; fb.style.color='#ef4444';}} else { if(val===ans){score++; q.classList.add('correct'); fb.textContent='صحيح'; fb.style.color='#10b981';} else {q.classList.add('incorrect'); fb.textContent='انتبه للوحدة والقيمة.'; fb.style.color='#ef4444';} } }
if(type==='match'){ const map=JSON.parse(q.dataset.match); let local=0,need=Object.keys(map).length; $$('.bucket',q).forEach(b=>{ const label=b.dataset.label; const tiles=$$('.tile',b).map(t=>t.textContent.trim()); tiles.forEach(t=>{ if(map[t]===label) local++; });}); if(local===need){score++; q.classList.add('correct'); fb.textContent='كل الأزواج صحيحة.'; fb.style.color='#10b981';} else {q.classList.add('incorrect'); fb.textContent=`${local}/${need} مطابقات صحيحة — راجع الصيغ.`; fb.style.color='#f59e0b';}}
}); $('#quizScore').textContent=`الدرجة: ${score}/${total}`; });
$('#resetQuiz').addEventListener('click',()=>{ const form=$('#quizForm'); form.reset(); $$('.q',form).forEach(q=>{ q.classList.remove('correct','incorrect'); q.querySelector('.feedback').textContent=''; }); $('#quizScore').textContent=''; });
// سحب وإفلات مبسّط
let dragEl=null; $$('.tile').forEach(t=>{ t.addEventListener('dragstart',e=>{ dragEl=t; e.dataTransfer.setData('text/plain', t.textContent); });});
$$('.bucket').forEach(b=>{ b.addEventListener('dragover',e=>e.preventDefault()); b.addEventListener('drop',e=>{ e.preventDefault(); if(dragEl){ b.appendChild(dragEl); dragEl=null; } });});


// === تطبيق W×L المصغّر ===
const ap=$('#apScope'); if(ap){
let W=8,L=6, zoom=1; const grid=$('#grid',ap); const metrics=$('#metrics',ap); const tH=$('#tH',ap), tV=$('#tV',ap); const stage=$('#stage',ap);
const wid=$('#widRange',ap), len=$('#lenRange',ap);
function buildGrid(){ grid.innerHTML=''; grid.style.gridTemplateColumns=`repeat(${W}, var(--cell))`; grid.style.gridTemplateRows=`repeat(${L}, var(--cell))`; for(let r=0;r<L;r++){ for(let c=0;c<W;c++){ const d=document.createElement('div'); d.className='cell'; d.dataset.r=r; d.dataset.c=c; grid.appendChild(d); } } updateGuides(); updateMetrics(); }
function updateGuides(){ if(tH) tH.textContent=`العرض = W = ${W}`; if(tV) tV.textContent=`الطول = L = ${L}`; }
function updateMetrics(){ const P=2*(L+W); const A=L*W; metrics.innerHTML=`<div class="row"><span class="tag">المحيط</span><div>P = 2(L + W) = 2(${L} + ${W}) = <b>${P}</b> وحدة</div></div><div class=\"row\"><span class=\"tag\">المساحة</span><div>A = L × W = ${L} × ${W} = <b>${A}</b> وحدة²</div></div>`; }
function colorArea(){ $$('.cell',grid).forEach(c=>{ c.classList.add('on-area'); c.classList.remove('on-per'); }); }
function colorPerimeter(){ $$('.cell',grid).forEach(c=>{ const r=+c.dataset.r, col=+c.dataset.c; const onB = (r===0||r===L-1||col===0||col===W-1); c.classList.toggle('on-per',onB); if(onB) c.classList.remove('on-area'); }); }
function clearColors(){ $$('.cell',grid).forEach(c=>c.classList.remove('on-area','on-per')); }
// أحداث
wid.addEventListener('input',()=>{ W=+wid.value; buildGrid(); });
len.addEventListener('input',()=>{ L=+len.value; buildGrid(); });
$('#addRow',ap).addEventListener('click',()=>{ L=Math.min(20,L+1); len.value=L; buildGrid(); });
$('#addCol',ap).addEventListener('click',()=>{ W=Math.min(20,W+1); wid.value=W; buildGrid(); });
$('#resetBtn',ap).addEventListener('click',()=>{ W=8; L=6; wid.value=W; len.value=L; zoom=1; stage.style.transform=`scale(${zoom})`; buildGrid(); });
$('#btnArea',ap).addEventListener('click',()=>{ clearColors(); colorArea(); });
$('#btnPerimeter',ap).addEventListener('click',()=>{ clearColors(); colorPerimeter(); });
$('#zoomIn',ap).addEventListener('click',()=>{ zoom=Math.min(2, zoom+0.1); stage.style.transform=`scale(${zoom})`; });
$('#zoomOut',ap).addEventListener('click',()=>{ zoom=Math.max(0.5, zoom-0.1); stage.style.transform=`scale(${zoom})`; });
$('#zoomReset',ap).addEventListener('click',()=>{ zoom=1; stage.style.transform=`scale(${zoom})`; });
buildGrid();
}
})();

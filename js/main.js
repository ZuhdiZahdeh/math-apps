async function loadApps() {
  const res = await fetch('assets/apps.json');
  const apps = await res.json();
  return apps;
}
function card(app) {
  return `
  <a class="card" href="${app.path}">
    <img src="${app.thumb}" alt="${app.title}">
    <div class="meta">
      <h3>${app.title}</h3>
      <p>${app.desc}</p>
      <div class="tags">
        <span>الصفوف: ${app.grades.join('، ')}</span>
        <span>${app.tags.join(' • ')}</span>
      </div>
    </div>
  </a>`;
}
function render(apps) {
  const grid = document.getElementById('appsGrid');
  grid.innerHTML = apps.map(card).join('');
}
function applyFilters(apps) {
  const g = document.getElementById('gradeFilter').value;
  const q = document.getElementById('q').value.trim();
  return apps.filter(a=>{
    const okG = (g==='all') || a.grades.includes(+g);
    const okQ = !q || (a.title+a.desc+a.tags.join(' ')).includes(q);
    return okG && okQ;
  });
}
(async ()=>{
  const apps = await loadApps();
  const doRender = ()=> render(applyFilters(apps));
  document.getElementById('gradeFilter').addEventListener('change', doRender);
  document.getElementById('q').addEventListener('input', doRender);
  doRender();
})();

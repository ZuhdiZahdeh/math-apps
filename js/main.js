import { byId, debounce, norm } from './utils.js';

const state = {
  apps: [],
  filtered: []
};

async function loadApps() {
  try {
    const res = await fetch('assets/apps.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('apps.json not found');
    return await res.json();
  } catch (e) {
    console.error(e);
    return [];
  }
}

function card(app) {
  return `
  <a class="card" href="${app.path}" aria-label="${app.title}">
    <img src="${app.thumb}" alt="${app.title}">
    <div class="pad">
      <h3>${app.title}</h3>
      <p>${app.desc || ''}</p>
      <div class="row">
        <div class="tags">
          <span class="badge">الصفوف: ${app.grades?.join('، ') || '-'}</span>
          ${ (app.tags||[]).slice(0,3).map(t=>`<span class="badge">${t}</span>`).join('') }
        </div>
      </div>
    </div>
  </a>`;
}

function render(list) {
  const grid = byId('appsGrid');
  grid.innerHTML = list.length ? list.map(card).join('') :
    `<div class="card"><div class="pad"><h3>لا توجد نتائج</h3><p>جرّب كلمات أخرى أو اختر صفًا مختلفًا.</p></div></div>`;
  byId('count').textContent = `عدد التطبيقات: ${list.length}`;
}

function applyFilters() {
  const g = byId('gradeFilter').value;
  const q = norm(byId('q').value);
  state.filtered = state.apps.filter(app=>{
    const okG = (g === 'all') || (app.grades || []).includes(+g);
    const blob = norm(`${app.title} ${app.desc} ${(app.tags||[]).join(' ')}`);
    const okQ = !q || blob.includes(q);
    return okG && okQ;
  });
  render(state.filtered);
}

async function init() {
  state.apps = await loadApps();
  render(state.apps);
  byId('gradeFilter').addEventListener('change', applyFilters);
  byId('q').addEventListener('input', debounce(applyFilters, 200));
}
init();

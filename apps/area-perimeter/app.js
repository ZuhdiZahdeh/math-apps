/* Area-Perimeter — Interactive Lab (L×W) */

(() => {
  // DOM refs
  const lenRange  = document.getElementById('lenRange');
  const widRange  = document.getElementById('widRange');
  const lenVal    = document.getElementById('lenVal');
  const widVal    = document.getElementById('widVal');

  const addRowBtn = document.getElementById('addRow');
  const addColBtn = document.getElementById('addCol');
  const resetBtn  = document.getElementById('resetBtn');

  const grid      = document.getElementById('grid');
  const stage     = document.getElementById('stage');

  const areaVal   = document.getElementById('areaVal');
  const periVal   = document.getElementById('periVal');
  const deltaA    = document.getElementById('deltaA');
  const deltaP    = document.getElementById('deltaP');

  // Guides
  const guides    = document.getElementById('guides');
  const tH        = document.getElementById('tH');
  const tV        = document.getElementById('tV');

  // Zoom
  const zoomInBtn = document.getElementById('zoomIn');
  const zoomOutBtn= document.getElementById('zoomOut');
  const zoomResetBtn = document.getElementById('zoomReset');

  let L = parseInt(lenRange.value, 10) || 6;
  let W = parseInt(widRange.value, 10) || 8;
  let zoom = 1;

  // Build grid
  function buildGrid({flash}={}) {
    // CSS grid template
    grid.style.gridTemplateColumns = `repeat(${W}, var(--cell))`;
    grid.style.gridTemplateRows    = `repeat(${L}, var(--cell))`;

    // Build cells
    let html = '';
    for (let r = 0; r < L; r++){
      for (let c = 0; c < W; c++){
        const isNewCol = flash === 'col' && c === W-1;
        const isNewRow = flash === 'row' && r === L-1;
        const cls = ['cell', 'flash'];
        if (isNewCol) cls.push('newCol');
        if (isNewRow) cls.push('newRow');
        html += `<div class="${cls.join(' ')}"></div>`;
      }
    }
    grid.innerHTML = html;

    // Add contextual classes to toggle dashed outline on the new strip
    grid.classList.toggle('colNew', flash === 'col');
    grid.classList.toggle('rowNew', flash === 'row');

    // Update texts
    lenVal.textContent = L;
    widVal.textContent = W;
    tH.textContent = `الطول = W = ${W}`;
    tV.textContent = `العرض = L = ${L}`;

    updateKPI();
    fitGuides();
  }

  function updateKPI(){
    const A = L * W;
    const P = 2 * (L + W);
    areaVal.textContent = A;
    periVal.textContent = P;
  }

  function showDelta(dA, dP){
    deltaA.textContent = (dA>0?'+':'') + dA;
    deltaP.textContent = (dP>0?'+':'') + dP;
    // Flash effect
    deltaA.parentElement.classList.add('flashKPI');
    deltaP.parentElement.classList.add('flashKPI');
    setTimeout(() => {
      deltaA.parentElement.classList.remove('flashKPI');
      deltaP.parentElement.classList.remove('flashKPI');
    }, 600);
  }

  function addColumn(){
    // ΔA = L, ΔP = 2 (إن كان L≥1)
    W = Math.min(50, W + 1);
    widRange.value = W;
    showDelta(L, 2);
    buildGrid({flash:'col'});
  }

  function addRow(){
    // ΔA = W, ΔP = 2 (إن كان W≥1)
    L = Math.min(50, L + 1);
    lenRange.value = L;
    showDelta(W, 2);
    buildGrid({flash:'row'});
  }

  function resetAll(){
    L = parseInt(lenRange.value = 6, 10);
    W = parseInt(widRange.value = 8, 10);
    showDelta(0,0);
    buildGrid({flash:undefined});
    zoom = 1;
    applyZoom();
  }

  function applyZoom(){
    stage.style.transform = `scale(${zoom})`;
    zoomResetBtn.textContent = `${Math.round(zoom*100)}%`;
    fitGuides();
  }

  // Fit guide label sizes dynamically
  function fitGuides(){
    const r = grid.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const minDim = Math.min(r.width, r.height);
    const fs = Math.max(12, Math.min(26, minDim * 0.06));
    const stroke = Math.max(1.2, Math.min(3, fs/10));
    guides.style.setProperty('--gFont',  fs + 'px');
    guides.style.setProperty('--gStroke', stroke);
  }

  // Events
  lenRange.addEventListener('input', e => { L = parseInt(e.target.value,10)||1; buildGrid(); });
  widRange.addEventListener('input', e => { W = parseInt(e.target.value,10)||1; buildGrid(); });

  addColBtn.addEventListener('click', addColumn);
  addRowBtn.addEventListener('click', addRow);
  resetBtn.addEventListener('click', resetAll);

  zoomInBtn.addEventListener('click', ()=>{ zoom = Math.min(1.8, +(zoom+0.1).toFixed(2)); applyZoom(); });
  zoomOutBtn.addEventListener('click', ()=>{ zoom = Math.max(0.6, +(zoom-0.1).toFixed(2)); applyZoom(); });
  zoomResetBtn.addEventListener('click', ()=>{ zoom = 1; applyZoom(); });

  // Keyboard shortcuts: ↑↓ لن L، ←→ لـ W
  document.addEventListener('keydown', (e)=>{
    if (e.altKey || e.metaKey || e.ctrlKey) return;
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){
      e.preventDefault();
      if (e.key === 'ArrowUp')   { L = Math.min(50, L+1); lenRange.value=L; buildGrid({flash:'row'}); }
      if (e.key === 'ArrowDown') { L = Math.max(1, L-1);  lenRange.value=L; buildGrid(); }
      if (e.key === 'ArrowRight'){ W = Math.min(50, W+1); widRange.value=W; buildGrid({flash:'col'}); }
      if (e.key === 'ArrowLeft') { W = Math.max(1, W-1);  widRange.value=W; buildGrid(); }
    }
  });

  // Init
  buildGrid();
  applyZoom();
})();

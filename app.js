const STORAGE_KEY = 'sprite-tracker-collection';

const spriteGrid = document.getElementById('sprite-grid');
const variantFilters = document.getElementById('variant-filters');
const progressBarFill = document.getElementById('progress-bar-fill');
const progressCount = document.getElementById('progress-count');
const progressPercent = document.getElementById('progress-percent');
const progressMaxed = document.getElementById('progress-maxed');
const resetBtn = document.getElementById('reset-btn');

const modal = document.getElementById('level-modal');
const modalTitle = document.getElementById('modal-title');
const modalSubtitle = document.getElementById('modal-subtitle');
const levelInput = document.getElementById('level-input');
const modalClose = document.getElementById('modal-close');
const modalSave = document.getElementById('modal-save');
const modalUnmark = document.getElementById('modal-unmark');

let collection = loadCollection();
let variantFilter = 'all';
let statusFilter = 'all';
let activeCardKey = null;

function loadCollection() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveCollection() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(collection));
}

function cardKey(spriteId, variant) {
  return `${spriteId}::${variant}`;
}

function buildAllCombos() {
  const combos = [];
  SPRITES.forEach((sprite) => {
    getVariantsFor(sprite.id).forEach((variant) => {
      combos.push({ sprite, variant, key: cardKey(sprite.id, variant) });
    });
  });
  return combos;
}

const ALL_COMBOS = buildAllCombos();

// Original placeholder art (simple gradient gem shape, tinted per
// variant tier) used until a real image exists at the path returned
// by spriteImageUrl(). No third-party artwork involved.
const VARIANT_COLORS = {
  Normal: ['#8a8a99', '#c4c4d1'],
  Gold: ['#caa233', '#ffe27a'],
  Gummy: ['#d63d8f', '#ff9bcf'],
  Galaxy: ['#5b3fd6', '#a98bff'],
  Mythic: ['#c23b1f', '#ff9a5a']
};

function placeholderIconUrl(variant) {
  const [c1, c2] = VARIANT_COLORS[variant] || VARIANT_COLORS.Normal;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${c1}" />
          <stop offset="100%" stop-color="${c2}" />
        </linearGradient>
      </defs>
      <polygon points="50,6 88,32 74,88 26,88 12,32" fill="url(#g)" stroke="rgba(255,255,255,0.4)" stroke-width="3"/>
    </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function renderVariantFilters() {
  const uniqueVariants = [...new Set(ALL_COMBOS.map((c) => c.variant))];
  uniqueVariants.forEach((variant) => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.dataset.variant = variant;
    btn.textContent = variant;
    btn.addEventListener('click', () => {
      variantFilter = variant;
      updateFilterButtons();
      renderGrid();
    });
    variantFilters.appendChild(btn);
  });

  variantFilters.querySelector('[data-variant="all"]').addEventListener('click', () => {
    variantFilter = 'all';
    updateFilterButtons();
    renderGrid();
  });
}

function updateFilterButtons() {
  variantFilters.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.variant === variantFilter);
  });
  document.querySelectorAll('[data-status]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.status === statusFilter);
  });
}

document.querySelectorAll('[data-status]').forEach((btn) => {
  btn.addEventListener('click', () => {
    statusFilter = btn.dataset.status;
    updateFilterButtons();
    renderGrid();
  });
});

function passesFilters(combo) {
  if (variantFilter !== 'all' && combo.variant !== variantFilter) return false;

  const entry = collection[combo.key];
  const owned = Boolean(entry);
  const maxed = owned && entry.level >= MAX_LEVEL;

  if (statusFilter === 'owned' && !owned) return false;
  if (statusFilter === 'unowned' && owned) return false;
  if (statusFilter === 'maxed' && !maxed) return false;

  return true;
}

function renderGrid() {
  spriteGrid.innerHTML = '';

  ALL_COMBOS.filter(passesFilters).forEach((combo) => {
    const entry = collection[combo.key];
    const owned = Boolean(entry);
    const maxed = owned && entry.level >= MAX_LEVEL;

    const card = document.createElement('div');
    card.className = 'sprite-card' + (owned ? ' owned' : '') + (maxed ? ' maxed' : '');

    const img = document.createElement('img');
    img.className = 'sprite-icon-img' + (owned ? ' owned' : '');
    img.alt = combo.sprite.name;
    img.src = spriteImageUrl(combo.sprite.id, combo.variant);
    img.addEventListener(
      'error',
      () => {
        img.src = placeholderIconUrl(combo.variant);
      },
      { once: true }
    );
    card.appendChild(img);

    const textWrap = document.createElement('div');
    textWrap.innerHTML = `
      <span class="sprite-name">${combo.sprite.name}</span>
      <span class="sprite-variant">${combo.variant}</span>
      ${owned ? `<span class="sprite-level">Lv. ${entry.level}${maxed ? ' (Max)' : ''}</span>` : ''}
    `;
    while (textWrap.firstChild) card.appendChild(textWrap.firstChild);

    card.addEventListener('click', () => openModal(combo));
    spriteGrid.appendChild(card);
  });

  updateProgress();
}

function updateProgress() {
  const total = ALL_COMBOS.length;
  const owned = ALL_COMBOS.filter((c) => collection[c.key]).length;
  const maxed = ALL_COMBOS.filter((c) => collection[c.key] && collection[c.key].level >= MAX_LEVEL).length;
  const percent = total === 0 ? 0 : Math.round((owned / total) * 100);

  progressBarFill.style.width = `${percent}%`;
  progressCount.textContent = `${owned} / ${total} owned`;
  progressPercent.textContent = `${percent}%`;
  progressMaxed.textContent = `${maxed} maxed`;
}

function openModal(combo) {
  activeCardKey = combo.key;
  const entry = collection[combo.key];

  modalTitle.textContent = combo.sprite.name;
  modalSubtitle.textContent = `${combo.variant} variant`;
  levelInput.value = entry ? entry.level : 1;
  levelInput.min = 1;

  modalUnmark.classList.toggle('hidden', !entry);
  modal.classList.remove('hidden');
  levelInput.focus();
}

function closeModal() {
  modal.classList.add('hidden');
  activeCardKey = null;
}

modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});

modalSave.addEventListener('click', () => {
  if (!activeCardKey) return;
  const level = Math.max(1, parseInt(levelInput.value, 10) || 1);
  collection[activeCardKey] = { level };
  saveCollection();
  closeModal();
  renderGrid();
});

modalUnmark.addEventListener('click', () => {
  if (!activeCardKey) return;
  delete collection[activeCardKey];
  saveCollection();
  closeModal();
  renderGrid();
});

resetBtn.addEventListener('click', () => {
  if (!confirm('Reset your entire sprite collection? This cannot be undone.')) return;
  collection = {};
  saveCollection();
  renderGrid();
});

renderVariantFilters();
renderGrid();

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
    card.innerHTML = `
      <div class="sprite-icon">${combo.sprite.name.charAt(0)}</div>
      <span class="sprite-name">${combo.sprite.name}</span>
      <span class="sprite-variant">${combo.variant}</span>
      ${owned ? `<span class="sprite-level">Lv. ${entry.level}${maxed ? ' (Max)' : ''}</span>` : ''}
    `;
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

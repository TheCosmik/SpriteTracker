const STORAGE_KEY = 'sprite-tracker-collection';

const spriteTable = document.getElementById('sprite-table');
const progressBarFill = document.getElementById('progress-bar-fill');
const progressCount = document.getElementById('progress-count');
const progressPercent = document.getElementById('progress-percent');
const progressMaxed = document.getElementById('progress-maxed');
const resetBtn = document.getElementById('reset-btn');

const modal = document.getElementById('level-modal');
const modalIcon = document.getElementById('modal-icon');
const modalTitle = document.getElementById('modal-title');
const modalSubtitle = document.getElementById('modal-subtitle');
const modalClose = document.getElementById('modal-close');
const masteryYes = document.getElementById('mastery-yes');
const masteryNo = document.getElementById('mastery-no');
const modalUnmark = document.getElementById('modal-unmark');

const GROUP_LABELS = {
  blue: 'Blue Tier',
  purple: 'Purple Tier',
  orange: 'Orange Tier',
  red: 'Red Tier'
};

let collection = loadCollection();
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

// Original placeholder art (simple gradient gem shape, tinted per
// variant tier) used until a real image exists at the path returned
// by spriteImageUrl(). No third-party artwork is involved.
const VARIANT_COLORS = {
  Holofoil: ['#6ee7ff', '#ff9bec'],
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

document.querySelectorAll('[data-status]').forEach((btn) => {
  btn.addEventListener('click', () => {
    statusFilter = btn.dataset.status;
    document.querySelectorAll('[data-status]').forEach((b) => {
      b.classList.toggle('active', b.dataset.status === statusFilter);
    });
    renderTable();
  });
});

function cellStatus(spriteId, variant) {
  const entry = collection[cardKey(spriteId, variant)];
  const owned = Boolean(entry);
  const maxed = owned && entry.level >= MAX_LEVEL;
  return { entry, owned, maxed };
}

function passesFilter({ owned, maxed }) {
  if (statusFilter === 'owned') return owned;
  if (statusFilter === 'unowned') return !owned;
  if (statusFilter === 'maxed') return maxed;
  return true;
}

function renderTable() {
  spriteTable.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'table-row table-header-row';
  header.innerHTML = `
    <div class="col-sprite-label">SPRITE</div>
    ${VARIANTS.map((v) => `<div class="col-variant-label${v === 'Holofoil' ? ' holofoil-label' : ''}">${v.toUpperCase()}</div>`).join('')}
  `;
  spriteTable.appendChild(header);

  let currentGroup = null;

  SPRITES.forEach((sprite) => {
    if (sprite.group !== currentGroup) {
      currentGroup = sprite.group;
      const groupHeader = document.createElement('div');
      groupHeader.className = 'group-header';
      groupHeader.style.setProperty('--group-color', GROUP_COLORS[currentGroup] || '#888');
      groupHeader.innerHTML = `<span class="group-header-bar"></span>${GROUP_LABELS[currentGroup] || currentGroup}`;
      spriteTable.appendChild(groupHeader);
    }

    const row = document.createElement('div');
    row.className = 'table-row';

    const label = document.createElement('div');
    label.className = 'sprite-label';
    label.innerHTML = `<span class="sprite-dot" style="background:${GROUP_COLORS[sprite.group] || '#888'}"></span>${sprite.name}`;
    row.appendChild(label);

    const availableVariants = getVariantsFor(sprite.id);

    VARIANTS.forEach((variant) => {
      if (!availableVariants.includes(variant)) {
        const naCell = document.createElement('div');
        naCell.className = 'sprite-cell na';
        naCell.textContent = '—';
        row.appendChild(naCell);
        return;
      }

      const { entry, owned, maxed } = cellStatus(sprite.id, variant);
      const matches = passesFilter({ owned, maxed });

      const cell = document.createElement('div');
      cell.className = 'sprite-cell' + (owned ? ' owned' : '') + (maxed ? ' maxed' : '') + (matches ? '' : ' dimmed');
      cell.style.setProperty('--cell-color', GROUP_COLORS[sprite.group] || '#c77dff');

      const img = document.createElement('img');
      img.className = 'sprite-icon-img' + (owned ? ' owned' : '');
      img.alt = `${sprite.name} (${variant})`;
      img.src = spriteImageUrl(sprite.id, variant);
      img.addEventListener(
        'error',
        () => {
          img.src = placeholderIconUrl(variant);
        },
        { once: true }
      );
      cell.appendChild(img);

      if (owned) {
        const levelTag = document.createElement('span');
        levelTag.className = 'sprite-level';
        levelTag.textContent = `Lv. ${entry.level}${maxed ? ' (Max)' : ''}`;
        cell.appendChild(levelTag);
      }

      cell.addEventListener('click', () => openModal(sprite, variant));
      row.appendChild(cell);
    });

    spriteTable.appendChild(row);
  });

  updateProgress();
}

function buildAllCombos() {
  const combos = [];
  SPRITES.forEach((sprite) => {
    getVariantsFor(sprite.id).forEach((variant) => {
      combos.push({ spriteId: sprite.id, variant });
    });
  });
  return combos;
}

const ALL_COMBOS = buildAllCombos();

function updateProgress() {
  const total = ALL_COMBOS.length;
  const owned = ALL_COMBOS.filter((c) => collection[cardKey(c.spriteId, c.variant)]).length;
  const maxed = ALL_COMBOS.filter((c) => {
    const entry = collection[cardKey(c.spriteId, c.variant)];
    return entry && entry.level >= MAX_LEVEL;
  }).length;
  const percent = total === 0 ? 0 : Math.round((owned / total) * 100);

  progressBarFill.style.width = `${percent}%`;
  progressCount.textContent = `${owned} / ${total} owned`;
  progressPercent.textContent = `${percent}%`;
  progressMaxed.textContent = `${maxed} maxed`;
}

function openModal(sprite, variant) {
  activeCardKey = cardKey(sprite.id, variant);
  const entry = collection[activeCardKey];

  modalIcon.src = spriteImageUrl(sprite.id, variant);
  modalIcon.alt = `${sprite.name} (${variant})`;
  modalIcon.onerror = () => {
    modalIcon.onerror = null;
    modalIcon.src = placeholderIconUrl(variant);
  };
  modalIcon.style.setProperty('--modal-icon-color', GROUP_COLORS[sprite.group] || '#c77dff');
  modalTitle.textContent = sprite.name;
  modalSubtitle.textContent = `${variant} variant`;

  const mastered = Boolean(entry && entry.level >= MAX_LEVEL);
  masteryYes.classList.toggle('active', mastered);
  masteryNo.classList.toggle('active', Boolean(entry) && !mastered);

  modalUnmark.classList.toggle('hidden', !entry);
  modal.classList.remove('hidden');
}

function closeModal() {
  modal.classList.add('hidden');
  activeCardKey = null;
}

modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});

masteryYes.addEventListener('click', () => {
  if (!activeCardKey) return;
  collection[activeCardKey] = { level: MAX_LEVEL };
  saveCollection();
  closeModal();
  renderTable();
});

masteryNo.addEventListener('click', () => {
  if (!activeCardKey) return;
  collection[activeCardKey] = { level: 1 };
  saveCollection();
  closeModal();
  renderTable();
});

modalUnmark.addEventListener('click', () => {
  if (!activeCardKey) return;
  delete collection[activeCardKey];
  saveCollection();
  closeModal();
  renderTable();
});

resetBtn.addEventListener('click', () => {
  if (!confirm('Reset your entire sprite collection? This cannot be undone.')) return;
  collection = {};
  saveCollection();
  renderTable();
});

renderTable();

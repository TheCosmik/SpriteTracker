// Sprite names/roster below reflect the current in-game collection.
// Fortnite's live item roster changes over time - double check this
// list periodically and add/rename entries as needed.
const SPRITES = [
  { id: 'water', name: 'Water', group: 'blue' },
  { id: 'earth', name: 'Earth', group: 'blue' },
  { id: 'fire', name: 'Fire', group: 'blue' },
  { id: 'fishy', name: 'Fishy', group: 'blue' },
  { id: 'duck', name: 'Duck', group: 'purple' },
  { id: 'ghost', name: 'Ghost', group: 'purple' },
  { id: 'demon', name: 'Demon', group: 'purple' },
  { id: 'king', name: 'King', group: 'purple' },
  { id: 'aura', name: 'Aura', group: 'purple' },
  { id: 'striker', name: 'Striker', group: 'purple' },
  { id: 'dream', name: 'Dream', group: 'orange' },
  { id: 'punk', name: 'Punk', group: 'orange' },
  { id: 'boss', name: 'Boss', group: 'orange' },
  { id: 'grim-reaper', name: 'Grim Reaper', group: 'orange' },
  { id: 'zero-point', name: 'Zero Point', group: 'red' },
  { id: 'burnt-peanut', name: 'Burnt Peanut', group: 'red', variants: ['Normal'] }
];

// Most sprites come in all four of these variants. A sprite can
// override this with its own `variants` array (see Burnt Peanut
// above) if it only has some of them.
const VARIANTS = ['Normal', 'Gold', 'Gummy', 'Galaxy'];

const GROUP_COLORS = {
  blue: '#3fa9ff',
  purple: '#b06bff',
  orange: '#ffa53f',
  red: '#ff5b5b'
};

const MAX_LEVEL = 3;

function getVariantsFor(spriteId) {
  const sprite = SPRITES.find((s) => s.id === spriteId);
  return (sprite && sprite.variants) || VARIANTS;
}

// Real per-sprite artwork path. Images live in images/sprites/ named
// like "water-normal.webp" (spriteId-variant, lowercase). If a file
// is missing at that path, the img's onerror handler swaps in an
// original placeholder graphic instead (see placeholderIconUrl in
// app.js).
function spriteImageUrl(spriteId, variant) {
  return `images/sprites/${spriteId}-${variant.toLowerCase()}.webp`;
}

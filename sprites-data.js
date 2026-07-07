// Sprite names below are seeded from confirmed, publicly reported Fortnite
// sprite names as of the June 2026 update. Fortnite's live item roster
// changes often - double check this list against the current in-game
// collection and add/rename entries as needed.
const SPRITES = [
  { id: 'striker', name: 'Striker' },
  { id: 'fishy', name: 'Fishy' },
  { id: 'aura', name: 'Aura' },
  { id: 'boss', name: 'Boss' },
  { id: 'grim-reaper', name: 'Grim Reaper' },
  { id: 'sprite-7', name: 'Sprite 7 (rename me)' },
  { id: 'sprite-8', name: 'Sprite 8 (rename me)' },
  { id: 'sprite-9', name: 'Sprite 9 (rename me)' },
  { id: 'sprite-10', name: 'Sprite 10 (rename me)' },
  { id: 'sprite-11', name: 'Sprite 11 (rename me)' },
  { id: 'sprite-12', name: 'Sprite 12 (rename me)' },
  { id: 'sprite-13', name: 'Sprite 13 (rename me)' },
  { id: 'burnt-peanut', name: 'Burnt Peanut' }
];

// Most sprites come in these four variants. Burnt Peanut is Mythic-only
// (per public reports) so it's handled as a special case below.
const VARIANTS = ['Normal', 'Gold', 'Gummy', 'Galaxy'];

const MYTHIC_ONLY = ['burnt-peanut'];

const MAX_LEVEL = 3;

function getVariantsFor(spriteId) {
  return MYTHIC_ONLY.includes(spriteId) ? ['Mythic'] : VARIANTS;
}

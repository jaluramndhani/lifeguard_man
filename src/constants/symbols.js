// ============================================
// LIFEGUARD MAN SLOT MACHINE - SYMBOL DEFINITIONS
// Same system as Witch/Diving: 10 symbols + 6 multipliers
// Grid: 6 columns × 5 rows = 30 cells
// Win: 8+ matching symbols (scatter pay)
// ============================================

// Symbol images (local imports)
import lifeRingImg from '../assets/images/symbols/lifeRing.png';
import swimsuitImg from '../assets/images/symbols/swimsuit.png';
import megaphoneImg from '../assets/images/symbols/megaphone.png';
import footballImg from '../assets/images/symbols/football.png';
import lifeguardBoyImg from '../assets/images/symbols/lifeguardBoy.png';
import firstAidKitImg from '../assets/images/symbols/firstAidKit.png';
import binocularsImg from '../assets/images/symbols/binoculars.png';
import whistleImg from '../assets/images/symbols/whistle.png';
import umbrellaImg from '../assets/images/symbols/umbrella.png';
import lifeguardTowerImg from '../assets/images/symbols/lifeguardTower.png';

// 10 Regular symbols with values (identical tier system)
export const SYMBOLS = [
  { id: 'lifeguardTower', src: lifeguardTowerImg, value: 500, name: 'Lifeguard Tower' },
  { id: 'lifeguardBoy', src: lifeguardBoyImg, value: 400, name: 'Lifeguard Boy' },
  { id: 'lifeRing', src: lifeRingImg, value: 300, name: 'Life Ring' },
  { id: 'firstAidKit', src: firstAidKitImg, value: 250, name: 'First Aid Kit' },
  { id: 'swimsuit', src: swimsuitImg, value: 200, name: 'Swimsuit' },
  { id: 'binoculars', src: binocularsImg, value: 150, name: 'Binoculars' },
  { id: 'umbrella', src: umbrellaImg, value: 100, name: 'Umbrella' },
  { id: 'megaphone', src: megaphoneImg, value: 80, name: 'Megaphone' },
  { id: 'football', src: footballImg, value: 60, name: 'Football' },
  { id: 'whistle', src: whistleImg, value: 20, name: 'Whistle' },
];

// 6 Multiplier symbols (identical to other variants)
export const MULTIPLIERS = [
  { id: 'mult2x', multiplier: 2, label: '2x', src: whistleImg },
  { id: 'mult3x', multiplier: 3, label: '3x', src: whistleImg },
  { id: 'mult5x', multiplier: 5, label: '5x', src: whistleImg },
  { id: 'mult10x', multiplier: 10, label: '10x', src: whistleImg },
  { id: 'mult25x', multiplier: 25, label: '25x', src: whistleImg },
  { id: 'mult50x', multiplier: 50, label: '50x', src: whistleImg },
];

// Grid configuration
export const GRID_COLS = 6;
export const GRID_ROWS = 5;
export const TOTAL_CELLS = GRID_COLS * GRID_ROWS;

// Bet configuration
export const MIN_BET = 10;
export const MAX_BET = 50;
export const BET_STEP = 10;

// Win configuration
export const MIN_WIN_COUNT = 8; // Need 8+ matching symbols to win
export const WIN_RATE = 0.30; // 30% win rate for testing
export const MULTIPLIER_CHANCE = 0; // Disabled for new system

// Get a random symbol (5% chance multiplier, 95% regular)
export const getRandomSymbol = () => {
  if (Math.random() < MULTIPLIER_CHANCE) {
    const mult = MULTIPLIERS[Math.floor(Math.random() * MULTIPLIERS.length)];
    return { ...mult, isMultiplier: true, instanceId: Math.random() };
  }
  const sym = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
  return { ...sym, instanceId: Math.random() };
};

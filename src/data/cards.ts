import type { CardDef } from '../types/game'

export const UNIT_CARDS: CardDef[] = [
  {
    id: 'interceptor', type: 'unit', name: 'INTERCEPTEUR', cost: 50, color: '#00ffaa',
    badge: 'UNITÉ', badgeClass: 'badge-unit',
    stats: [{ label: 'ATK', value: '15' }, { label: 'HP', value: '60' }, { label: 'SPD', value: '★★★' }],
    svgViewBox: '-25 -20 50 40',
    svgContent: '<g stroke="#00ffaa" fill="none" stroke-width="1.5"><path d="M12,0 L-10,-8 L-6,0 L-10,8 Z"/><line x1="-15" y1="0" x2="-6" y2="0" stroke-opacity="0.4"/></g>',
  },
  {
    id: 'repair_drone', type: 'unit', name: 'DRONE SOIN', cost: 80, color: '#00d4ff',
    badge: 'SOIN', badgeClass: 'badge-unit',
    stats: [{ label: 'SOIN', value: '+0.8' }, { label: 'HP', value: '40' }, { label: 'SPD', value: '★★★' }],
    svgViewBox: '-25 -20 50 40',
    svgContent: '<g stroke="#00d4ff" fill="none" stroke-width="1.5"><rect x="-8" y="-8" width="16" height="16"/><line x1="0" y1="-11" x2="0" y2="11"/><line x1="-11" y1="0" x2="11" y2="0"/><circle cx="0" cy="0" r="4" fill="rgba(0,212,255,0.2)"/></g>',
  },
  {
    id: 'sniper', type: 'unit', name: 'SNIPER', cost: 180, color: '#00ffcc',
    badge: 'UNITÉ', badgeClass: 'badge-unit',
    stats: [{ label: 'ATK', value: '100' }, { label: 'HP', value: '40' }, { label: 'RNG', value: '★★★' }],
    svgViewBox: '-25 -20 50 40',
    svgContent: '<g stroke="#00ffcc" fill="none" stroke-width="1.5"><path d="M20,0 L-12,-4 L-12,4 Z"/><circle cx="0" cy="0" r="5"/><line x1="20" y1="0" x2="28" y2="0" stroke-dasharray="2,2"/></g>',
  },
  {
    id: 'bomber', type: 'unit', name: 'BOMBARDIER', cost: 150, color: '#ffaa00',
    badge: 'UNITÉ', badgeClass: 'badge-unit',
    stats: [{ label: 'ATK', value: '60' }, { label: 'HP', value: '150' }, { label: 'SPD', value: '★★' }],
    svgViewBox: '-25 -20 50 40',
    svgContent: '<g stroke="#ffaa00" fill="none" stroke-width="1.5"><rect x="-12" y="-10" width="24" height="20"/><line x1="12" y1="0" x2="-12" y2="-14"/><line x1="12" y1="0" x2="-12" y2="14"/><circle cx="-4" cy="5" r="3" fill="rgba(255,170,0,0.3)"/><circle cx="4" cy="-5" r="3" fill="rgba(255,170,0,0.3)"/></g>',
  },
  {
    id: 'tank', type: 'unit', name: 'CUIRASSÉ', cost: 250, color: '#ff4444',
    badge: 'LOURD', badgeClass: 'badge-unit',
    stats: [{ label: 'ATK', value: '30' }, { label: 'HP', value: '600' }, { label: 'SPD', value: '★' }],
    svgViewBox: '-28 -22 56 44',
    svgContent: '<g stroke="#ff4444" fill="none" stroke-width="2"><circle cx="0" cy="0" r="14"/><rect x="-18" y="-16" width="36" height="32"/><rect x="0" y="-4" width="22" height="8" fill="rgba(255,68,68,0.2)"/></g>',
  },
  {
    id: 'scout', type: 'unit', name: 'ÉCLAIREUR', cost: 35, color: '#aaff00',
    badge: 'ÉCLAIREUR', badgeClass: 'badge-unit',
    stats: [{ label: 'ATK', value: '8' }, { label: 'HP', value: '30' }, { label: 'SPD', value: '★★★★' }],
    svgViewBox: '-25 -20 50 40',
    svgContent: '<g stroke="#aaff00" fill="none" stroke-width="1.5"><path d="M15,0 L-8,-5 L-5,0 L-8,5 Z"/><path d="M5,0 L-15,-3 L-13,0 L-15,3 Z" opacity="0.5"/><circle cx="8" cy="0" r="3" fill="rgba(170,255,0,0.2)"/></g>',
  },
  {
    id: 'medic', type: 'unit', name: 'MÉDIC', cost: 120, color: '#ff88ff',
    badge: 'SOUTIEN', badgeClass: 'badge-unit',
    stats: [{ label: 'SOIN', value: 'UNITÉS' }, { label: 'HP', value: '80' }, { label: 'SPD', value: '★★' }],
    svgViewBox: '-25 -20 50 40',
    svgContent: '<g stroke="#ff88ff" fill="none" stroke-width="1.5"><circle cx="0" cy="0" r="12"/><line x1="0" y1="-7" x2="0" y2="7"/><line x1="-7" y1="0" x2="7" y2="0"/><circle cx="0" cy="0" r="5" fill="rgba(255,136,255,0.15)"/></g>',
  },
]

export const BUILDING_CARDS: CardDef[] = [
  {
    id: 'turret', type: 'building', name: 'TOURELLE', cost: 200, color: '#b000ff',
    badge: 'BÂTIMENT', badgeClass: 'badge-building',
    stats: [{ label: 'ATK', value: '25' }, { label: 'HP', value: '400' }, { label: 'RNG', value: '★★★' }],
    svgViewBox: '-25 -20 50 40',
    svgContent: '<g stroke="#b000ff" fill="none" stroke-width="1.5"><circle cx="0" cy="0" r="12"/><rect x="0" y="-4" width="22" height="8"/><rect x="-12" y="10" width="24" height="6" fill="rgba(176,0,255,0.2)"/></g>',
  },
  {
    id: 'bunker', type: 'building', name: 'BUNKER', cost: 300, color: '#888899',
    badge: 'BÂTIMENT', badgeClass: 'badge-building',
    stats: [{ label: 'HP', value: '1200' }, { label: 'ARM', value: '★★★' }, { label: 'SLOT', value: '3' }],
    svgViewBox: '-25 -20 50 40',
    svgContent: '<g stroke="#888899" fill="none" stroke-width="1.5"><rect x="-18" y="-10" width="36" height="22" rx="3"/><rect x="-18" y="-10" width="36" height="8" fill="rgba(136,136,153,0.2)"/><line x1="-8" y1="-10" x2="-8" y2="12"/><line x1="8" y1="-10" x2="8" y2="12"/><rect x="-5" y="-2" width="10" height="14" fill="rgba(136,136,153,0.15)"/></g>',
  },
  {
    id: 'generator', type: 'building', name: 'GÉNÉRATEUR', cost: 350, color: '#ffd700',
    badge: 'ÉCONOMIE', badgeClass: 'badge-building',
    stats: [{ label: '+CR', value: '+8/s' }, { label: 'HP', value: '200' }, { label: 'MAX', value: '3' }],
    svgViewBox: '-25 -20 50 40',
    svgContent: '<g stroke="#ffd700" fill="none" stroke-width="1.5"><circle cx="0" cy="0" r="14"/><circle cx="0" cy="0" r="7" fill="rgba(255,215,0,0.15)"/><path d="M4,-10 L-2,0 L4,0 L-4,10" stroke="#ffd700" stroke-width="2"/></g>',
  },
  {
    id: 'radar', type: 'building', name: 'RADAR', cost: 250, color: '#00ffff',
    badge: 'SUPPORT', badgeClass: 'badge-building',
    stats: [{ label: 'VIS', value: '+50%' }, { label: 'HP', value: '150' }, { label: 'BUFF', value: 'ZONE' }],
    svgViewBox: '-25 -20 50 40',
    svgContent: '<g stroke="#00ffff" fill="none" stroke-width="1.5"><circle cx="0" cy="0" r="14" stroke-dasharray="3,3"/><circle cx="0" cy="0" r="8" stroke-dasharray="2,2" opacity="0.6"/><circle cx="0" cy="0" r="3" fill="rgba(0,255,255,0.3)"/><line x1="0" y1="0" x2="12" y2="-7" stroke-width="2"/></g>',
  },
  {
    id: 'wall', type: 'building', name: 'MUR DÉFENSIF', cost: 100, color: '#778866',
    badge: 'DÉFENSE', badgeClass: 'badge-building',
    stats: [{ label: 'HP', value: '2000' }, { label: 'ARM', value: '★★★★' }, { label: 'MAX', value: '5' }],
    svgViewBox: '-25 -20 50 40',
    svgContent: '<g stroke="#778866" fill="none" stroke-width="1.5"><rect x="-20" y="-8" width="40" height="16" fill="rgba(119,136,102,0.2)"/><line x1="-10" y1="-8" x2="-10" y2="8"/><line x1="0" y1="-8" x2="0" y2="8"/><line x1="10" y1="-8" x2="10" y2="8"/><line x1="-20" y1="0" x2="20" y2="0" opacity="0.4"/></g>',
  },
]

export const SPECIAL_CARDS: CardDef[] = [
  {
    id: 'orbital', type: 'special', name: 'FRAPPE ORBITALE', cost: 300, color: '#ff00aa',
    badge: 'SPÉCIAL', badgeClass: 'badge-special', fullWidth: true,
    stats: [{ label: 'DMG', value: '400' }, { label: 'ZONE', value: '150px' }, { label: 'INSTANT', value: '✓' }],
    svgViewBox: '-35 -25 70 50',
    svgContent: '<g stroke="#ff00aa" fill="none" stroke-width="1.5"><circle cx="0" cy="-10" r="18" stroke-dasharray="4,3" opacity="0.4"/><path d="M0,-28 L-5,-10 L0,-14 L5,-10 Z" fill="rgba(255,0,170,0.3)"/><circle cx="0" cy="8" r="6" fill="rgba(255,0,170,0.2)"/><line x1="-20" y1="18" x2="20" y2="18" opacity="0.3"/><path d="M-15,12 L15,12" stroke-width="3" opacity="0.5"/></g>',
  },
  {
    id: 'shield', type: 'special', name: "BOUCLIER D'URGENCE", cost: 200, color: '#4488ff',
    badge: 'SPÉCIAL', badgeClass: 'badge-special', fullWidth: true,
    stats: [{ label: 'DUR', value: '8s' }, { label: 'DMG', value: '-80%' }, { label: 'ZONE', value: 'BASE' }],
    svgViewBox: '-35 -25 70 50',
    svgContent: '<g stroke="#4488ff" fill="none" stroke-width="1.5"><path d="M0,-20 L18,-8 L18,5 Q18,20 0,25 Q-18,20 -18,5 L-18,-8 Z" fill="rgba(68,136,255,0.15)"/><path d="M0,-20 L18,-8 L18,5 Q18,20 0,25 Q-18,20 -18,5 L-18,-8 Z"/><line x1="0" y1="-15" x2="0" y2="20" opacity="0.4"/><line x1="-14" y1="-3" x2="14" y2="-3" opacity="0.4"/></g>',
  },
  {
    id: 'emp', type: 'special', name: 'IMPULSION EMP', cost: 400, color: '#ffff00',
    badge: 'SPÉCIAL', badgeClass: 'badge-special', fullWidth: true,
    stats: [{ label: 'STUN', value: '3s' }, { label: 'ZONE', value: 'FULL' }, { label: 'TOUS', value: 'ENNEMIS' }],
    svgViewBox: '-35 -25 70 50',
    svgContent: '<g stroke="#ffff00" fill="none" stroke-width="1.5"><circle cx="0" cy="0" r="20" stroke-dasharray="6,3" opacity="0.3"/><circle cx="0" cy="0" r="12" stroke-dasharray="4,2" opacity="0.5"/><path d="M6,-16 L-3,0 L6,0 L-6,16" stroke="#ffff00" stroke-width="2.5"/></g>',
  },
]

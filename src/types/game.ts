export type Team = 'player' | 'enemy'

export type UnitType =
  | 'interceptor' | 'repair_drone' | 'sniper' | 'bomber'
  | 'tank' | 'scout' | 'medic'

export type BuildingType = 'turret' | 'bunker' | 'generator' | 'radar' | 'wall'

export type EntityType = UnitType | BuildingType

export type SpecialType = 'orbital' | 'shield' | 'emp'

export type CardType = EntityType | SpecialType

export type TabId = 'units' | 'buildings' | 'special'

export interface Base {
  x: number
  y: number
  hp: number
  maxHp: number
  color: string
}

export interface Bullet {
  x: number
  y: number
  vx: number
  vy: number
  team: Team
  damage: number
  size: number
  type: EntityType
}

export interface TooltipData {
  name: string
  desc: string
}

export interface CardDef {
  id: CardType
  type: 'unit' | 'building' | 'special'
  name: string
  cost: number
  color: string
  badge: string
  badgeClass: string
  fullWidth?: boolean
  stats: { label: string; value: string }[]
  svgViewBox: string
  svgContent: string
}

export const BUILDING_TYPES = new Set<EntityType>([
  'turret', 'bunker', 'generator', 'radar', 'wall',
])

export const BUILDING_LIMITS: Record<string, number> = {
  turret: 5,
  bunker: 3,
  generator: 3,
  radar: 2,
  wall: 5,
}

export const COSTS: Record<CardType, number> = {
  interceptor: 50,
  repair_drone: 80,
  sniper: 180,
  bomber: 150,
  tank: 250,
  scout: 35,
  medic: 120,
  turret: 200,
  bunker: 300,
  generator: 350,
  radar: 250,
  wall: 100,
  orbital: 300,
  shield: 200,
  emp: 400,
}

export const TOOLTIPS: Record<CardType, TooltipData> = {
  interceptor:   { name: 'Intercepteur',      desc: 'Chasseur rapide polyvalent. Idéal pour intercepter les unités ennemies.' },
  repair_drone:  { name: 'Drone Soin',         desc: 'Orbite autour de la base et la répare constamment. Ne combat pas.' },
  sniper:        { name: 'Sniper',             desc: 'Longue portée extrême. Fragile mais dévastateur contre les cibles uniques.' },
  bomber:        { name: 'Bombardier',         desc: 'Gros dégâts par salve. Efficace contre les unités lourdes.' },
  tank:          { name: 'Cuirassé',           desc: 'Unité de siège blindée. Absorbe d\'énormes dégâts, avance lentement.' },
  scout:         { name: 'Éclaireur',          desc: 'Le plus rapide du jeu. Peu résistant, mais distrait et sonde l\'avant.' },
  medic:         { name: 'Médic',              desc: 'Soigne les unités alliées proches au fil du temps. Priorité à garder en vie.' },
  turret:        { name: 'Tourelle',           desc: 'Défense fixe à haute cadence. Reste en place, protège une zone.' },
  bunker:        { name: 'Bunker',             desc: 'Fortification lourde. Très haute HP, absorbe les assauts ennemis comme bouclier.' },
  generator:     { name: 'Générateur',         desc: 'Produit +8 crédits/seconde. Détruire ceux de l\'ennemi coupe son économie.' },
  radar:         { name: 'Radar',              desc: 'Révèle les ennemis plus tôt et booste le tir de toutes les unités proches (+15% dégâts).' },
  wall:          { name: 'Mur Défensif',       desc: 'Barrière passive avec une HP colossale. Ralentit l\'avance ennemie.' },
  orbital:       { name: 'Frappe Orbitale',    desc: 'Cliquez sur la map pour déclencher un bombardement massif (zone 150px, 400 dégâts).' },
  shield:        { name: 'Bouclier d\'Urgence', desc: 'Réduit de 80% les dégâts subis par la base pendant 8 secondes. Bon en dernier recours.' },
  emp:           { name: 'Impulsion EMP',      desc: 'Paralyse toutes les unités ennemies pendant 3 secondes. Aucune ne peut tirer ni bouger.' },
}

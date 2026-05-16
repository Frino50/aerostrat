import { reactive, computed, watch } from 'vue'
import type { CardType } from '../types/game'

// ── Types ──
export type ScreenId = 'menu' | 'game' | 'settings' | 'campaign' | 'tree' | 'credits'

export interface CampaignMission {
  id: number
  name: string
  brief: string
  // Reward in XP (used to unlock tech-tree nodes)
  xp: number
  // Bonus multipliers applied to enemy bot
  enemyHpMult: number
  enemyDamageMult: number
  enemyIncomeMult: number
  // Optional: enemy starts with extra money
  enemyStartingBonus: number
}

export interface TechNode {
  id: string
  // CardType to unlock; if null, it's a passive stat bonus
  unlocks: CardType | null
  name: string
  desc: string
  cost: number
  // Node IDs that must be unlocked first
  requires: string[]
  // Position in the grid (col, row)
  col: number
  row: number
  // emoji icon used as image-placeholder
  icon: string
  // Passive bonus (optional): adds to player starting money / income / base HP
  bonus?: {
    startMoney?: number
    income?: number
    baseHp?: number
  }
}

// ── Persistent meta state ──
const STORAGE_KEY = 'aerostrat.meta.v1'

interface PersistedState {
  xp: number
  unlocked: string[]          // tech node IDs
  campaignProgress: number    // index of next mission to play (0-based)
  settings: {
    musicVolume: number       // 0..1
    sfxVolume: number         // 0..1
    muted: boolean
    difficulty: 'easy' | 'normal' | 'hard'
    showFps: boolean
  }
}

function loadPersisted(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...defaults(), ...JSON.parse(raw) }
  } catch (_) { /* ignore */ }
  return defaults()
}

function defaults(): PersistedState {
  return {
    xp: 0,
    unlocked: ['root'],
    campaignProgress: 0,
    settings: {
      musicVolume: 0.4,
      sfxVolume: 0.6,
      muted: false,
      difficulty: 'normal',
      showFps: false,
    },
  }
}

export const meta = reactive<PersistedState>(loadPersisted())

function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(meta)) } catch (_) { /* ignore */ }
}
watch(meta, persist, { deep: true })

// ── UI state ──
export const currentScreen = reactive({ id: 'menu' as ScreenId })
export const miniMenuCollapsed = reactive({ value: false })
export const activeMission = reactive<{ mission: CampaignMission | null }>({ mission: null })

export function goTo(id: ScreenId) {
  currentScreen.id = id
  playSfx('click')
}

// ── Campaign definition ──
export const CAMPAIGN: CampaignMission[] = [
  { id: 1, name: 'Reconnaissance',     brief: 'Premier contact. Repousse une faible patrouille ennemie.',          xp: 50,  enemyHpMult: 0.8, enemyDamageMult: 0.9, enemyIncomeMult: 0.8, enemyStartingBonus: 0 },
  { id: 2, name: 'Avant-Poste',        brief: 'L\'ennemi consolide ses positions. Détruis sa base avancée.',       xp: 75,  enemyHpMult: 1.0, enemyDamageMult: 1.0, enemyIncomeMult: 1.0, enemyStartingBonus: 100 },
  { id: 3, name: 'Embuscade',          brief: 'Ils ont préparé un piège. Préviens l\'assaut éclair.',              xp: 100, enemyHpMult: 1.1, enemyDamageMult: 1.1, enemyIncomeMult: 1.15, enemyStartingBonus: 200 },
  { id: 4, name: 'Forteresse Ennemie', brief: 'Base fortifiée. Économie ennemie boostée.',                          xp: 150, enemyHpMult: 1.25, enemyDamageMult: 1.15, enemyIncomeMult: 1.3, enemyStartingBonus: 350 },
  { id: 5, name: 'Contre-Offensive',   brief: 'L\'ennemi passe à l\'attaque massive.',                              xp: 200, enemyHpMult: 1.4, enemyDamageMult: 1.25, enemyIncomeMult: 1.45, enemyStartingBonus: 500 },
  { id: 6, name: 'Front Brisé',        brief: 'Tout est contre toi. Tiens ta ligne.',                              xp: 300, enemyHpMult: 1.6, enemyDamageMult: 1.4, enemyIncomeMult: 1.6, enemyStartingBonus: 700 },
  { id: 7, name: 'Le Commandant',      brief: 'Affronte le général ennemi. Combat final.',                          xp: 500, enemyHpMult: 2.0, enemyDamageMult: 1.6, enemyIncomeMult: 1.8, enemyStartingBonus: 1000 },
]

// ── Tech tree definition ──
// Layout grid (col,row). col 0 = root on the left, branches expand to the right.
export const TECH_TREE: TechNode[] = [
  { id: 'root',         unlocks: 'interceptor',  name: 'Intercepteur',  desc: 'Unité de base. Déjà débloquée.', cost: 0,   requires: [],            col: 0, row: 2, icon: '✈️' },

  // ── Branche UNITÉS (haut) ──
  { id: 'scout',        unlocks: 'scout',        name: 'Éclaireur',     desc: 'Unité rapide pour harceler.',     cost: 50,  requires: ['root'],      col: 1, row: 0, icon: '🛩️' },
  { id: 'sniper',       unlocks: 'sniper',       name: 'Sniper',        desc: 'Longue portée, gros dégâts.',    cost: 150, requires: ['scout'],     col: 2, row: 0, icon: '🎯' },
  { id: 'bomber',       unlocks: 'bomber',       name: 'Bombardier',    desc: 'Dégâts de zone élevés.',          cost: 200, requires: ['scout'],     col: 2, row: 1, icon: '💣' },
  { id: 'tank',         unlocks: 'tank',         name: 'Cuirassé',      desc: 'Char lourd blindé.',              cost: 300, requires: ['bomber'],    col: 3, row: 1, icon: '🛡️' },

  // ── Branche SUPPORT (milieu) ──
  { id: 'repair',       unlocks: 'repair_drone', name: 'Drone Réparateur', desc: 'Répare la base en continu.',   cost: 75,  requires: ['root'],      col: 1, row: 2, icon: '🔧' },
  { id: 'medic',        unlocks: 'medic',        name: 'Médic',         desc: 'Soigne les unités proches.',      cost: 150, requires: ['repair'],    col: 2, row: 2, icon: '➕' },

  // ── Branche BÂTIMENTS (bas) ──
  { id: 'wall',         unlocks: 'wall',         name: 'Mur',           desc: 'Barrière défensive solide.',      cost: 50,  requires: ['root'],      col: 1, row: 3, icon: '🧱' },
  { id: 'turret',       unlocks: 'turret',       name: 'Tourelle',      desc: 'Défense automatique.',            cost: 150, requires: ['wall'],      col: 2, row: 3, icon: '🗼' },
  { id: 'generator',    unlocks: 'generator',    name: 'Générateur',    desc: '+8 crédits/sec.',                 cost: 200, requires: ['wall'],      col: 2, row: 4, icon: '⚡' },
  { id: 'radar',        unlocks: 'radar',        name: 'Radar',         desc: '+15% dégâts unités proches.',     cost: 250, requires: ['turret'],    col: 3, row: 3, icon: '📡' },
  { id: 'bunker',       unlocks: 'bunker',       name: 'Bunker',        desc: 'Forteresse mobile résistante.',   cost: 350, requires: ['turret'],    col: 3, row: 4, icon: '🏰' },

  // ── Branche POUVOIRS (extrême droite) ──
  { id: 'shield',       unlocks: 'shield',       name: 'Bouclier',      desc: 'Protège la base 8s.',             cost: 200, requires: ['medic'],     col: 3, row: 2, icon: '🛡️' },
  { id: 'emp',          unlocks: 'emp',          name: 'EMP',           desc: 'Paralyse les ennemis 3s.',        cost: 400, requires: ['shield'],    col: 4, row: 2, icon: '⚡' },
  { id: 'orbital',      unlocks: 'orbital',      name: 'Frappe Orbitale', desc: 'Bombardement ciblé.',           cost: 500, requires: ['emp'],       col: 5, row: 2, icon: '☄️' },

  // ── Bonus passifs ──
  { id: 'bonus_money',  unlocks: null,           name: 'Trésorerie',    desc: '+200 crédits au départ.',          cost: 100, requires: ['root'],      col: 1, row: 5, icon: '💰', bonus: { startMoney: 200 } },
  { id: 'bonus_income', unlocks: null,           name: 'Économie+',     desc: '+5 crédits/sec de base.',          cost: 250, requires: ['bonus_money'], col: 2, row: 5, icon: '📈', bonus: { income: 5 } },
  { id: 'bonus_hp',     unlocks: null,           name: 'Renforts',      desc: '+500 PV de base.',                 cost: 300, requires: ['bonus_income'], col: 3, row: 5, icon: '❤️', bonus: { baseHp: 500 } },
]

export function isUnlocked(nodeId: string): boolean {
  return meta.unlocked.includes(nodeId)
}

export function canUnlock(node: TechNode): boolean {
  if (isUnlocked(node.id)) return false
  if (meta.xp < node.cost) return false
  return node.requires.every(r => isUnlocked(r))
}

export function unlockNode(nodeId: string): boolean {
  const node = TECH_TREE.find(n => n.id === nodeId)
  if (!node || !canUnlock(node)) { playSfx('error'); return false }
  meta.xp -= node.cost
  meta.unlocked.push(nodeId)
  playSfx('unlock')
  return true
}

// Set of CardTypes currently unlocked by the player
export const unlockedCards = computed<Set<string>>(() => {
  const s = new Set<string>()
  for (const id of meta.unlocked) {
    const n = TECH_TREE.find(x => x.id === id)
    if (n && n.unlocks) s.add(n.unlocks)
  }
  return s
})

// Aggregated passive bonuses from unlocked nodes
export const passiveBonuses = computed(() => {
  let startMoney = 0, income = 0, baseHp = 0
  for (const id of meta.unlocked) {
    const n = TECH_TREE.find(x => x.id === id)
    if (n?.bonus) {
      startMoney += n.bonus.startMoney || 0
      income += n.bonus.income || 0
      baseHp += n.bonus.baseHp || 0
    }
  }
  return { startMoney, income, baseHp }
})

export function awardXp(amount: number) {
  meta.xp += amount
}

export function resetProgress() {
  Object.assign(meta, defaults())
  persist()
}

// ── Audio (WebAudio synthesis, no asset files needed) ──
let audioCtx: AudioContext | null = null
let musicGain: GainNode | null = null
let sfxGain: GainNode | null = null
let musicStarted = false
let musicTimer: number | null = null

function ensureAudio() {
  if (audioCtx) return audioCtx
  try {
    const Ctx = (window.AudioContext || (window as any).webkitAudioContext)
    audioCtx = new Ctx()
    musicGain = audioCtx.createGain()
    sfxGain = audioCtx.createGain()
    musicGain.gain.value = meta.settings.muted ? 0 : meta.settings.musicVolume * 0.4
    sfxGain.gain.value = meta.settings.muted ? 0 : meta.settings.sfxVolume
    musicGain.connect(audioCtx.destination)
    sfxGain.connect(audioCtx.destination)
  } catch (_) {
    audioCtx = null
  }
  return audioCtx
}

// Keep gains in sync with settings
watch(() => [meta.settings.musicVolume, meta.settings.sfxVolume, meta.settings.muted], () => {
  if (!audioCtx || !musicGain || !sfxGain) return
  musicGain.gain.value = meta.settings.muted ? 0 : meta.settings.musicVolume * 0.4
  sfxGain.gain.value = meta.settings.muted ? 0 : meta.settings.sfxVolume
})

export type SfxKind = 'click' | 'hover' | 'unlock' | 'error' | 'victory' | 'defeat' | 'shoot' | 'explosion'

export function playSfx(kind: SfxKind) {
  const ctx = ensureAudio()
  if (!ctx || !sfxGain) return
  const now = ctx.currentTime
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.connect(g); g.connect(sfxGain)

  switch (kind) {
    case 'click':
      osc.type = 'square'; osc.frequency.setValueAtTime(880, now)
      g.gain.setValueAtTime(0.15, now); g.gain.exponentialRampToValueAtTime(0.0001, now + 0.07)
      osc.start(now); osc.stop(now + 0.08); break
    case 'hover':
      osc.type = 'sine'; osc.frequency.setValueAtTime(1320, now)
      g.gain.setValueAtTime(0.05, now); g.gain.exponentialRampToValueAtTime(0.0001, now + 0.05)
      osc.start(now); osc.stop(now + 0.06); break
    case 'unlock':
      osc.type = 'triangle'; osc.frequency.setValueAtTime(523, now)
      osc.frequency.exponentialRampToValueAtTime(1046, now + 0.25)
      g.gain.setValueAtTime(0.2, now); g.gain.exponentialRampToValueAtTime(0.0001, now + 0.3)
      osc.start(now); osc.stop(now + 0.3); break
    case 'error':
      osc.type = 'sawtooth'; osc.frequency.setValueAtTime(200, now)
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.2)
      g.gain.setValueAtTime(0.2, now); g.gain.exponentialRampToValueAtTime(0.0001, now + 0.22)
      osc.start(now); osc.stop(now + 0.22); break
    case 'victory':
      playArpeggio([523, 659, 784, 1046], 0.12); break
    case 'defeat':
      playArpeggio([523, 440, 349, 261], 0.18); break
    case 'shoot':
      osc.type = 'square'; osc.frequency.setValueAtTime(1500, now)
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.08)
      g.gain.setValueAtTime(0.08, now); g.gain.exponentialRampToValueAtTime(0.0001, now + 0.08)
      osc.start(now); osc.stop(now + 0.08); break
    case 'explosion':
      osc.type = 'sawtooth'; osc.frequency.setValueAtTime(120, now)
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.4)
      g.gain.setValueAtTime(0.25, now); g.gain.exponentialRampToValueAtTime(0.0001, now + 0.4)
      osc.start(now); osc.stop(now + 0.4); break
  }
}

function playArpeggio(freqs: number[], step: number) {
  const ctx = ensureAudio()
  if (!ctx || !sfxGain) return
  freqs.forEach((f, i) => {
    const t = ctx.currentTime + i * step
    const osc = ctx.createOscillator(); const g = ctx.createGain()
    osc.type = 'triangle'; osc.frequency.setValueAtTime(f, t)
    g.gain.setValueAtTime(0.15, t); g.gain.exponentialRampToValueAtTime(0.0001, t + step * 0.9)
    osc.connect(g); g.connect(sfxGain!)
    osc.start(t); osc.stop(t + step)
  })
}

// ── 8-bit chiptune music ──
// Notes are MIDI numbers; -1 = rest. Each step lasts STEP_DURATION seconds.
const STEP_DURATION = 0.18
// Catchy 32-step melody in A minor (lead square wave)
const LEAD_PATTERN: number[] = [
  69, 72, 76, 72, 69, 72, 76, 79,
  77, 76, 74, 72, 74, 76, 72, 69,
  67, 69, 72, 69, 67, 69, 72, 76,
  74, 72, 71, 69, 67, 69, 71, 72,
]
// Bass line (one note per 2 lead steps)
const BASS_PATTERN: number[] = [
  45, 45, 52, 52, 45, 45, 52, 52,
  43, 43, 50, 50, 43, 43, 50, 50,
]
// Simple kick drum pattern (1 = kick, 0 = silence)
const DRUM_PATTERN: number[] = [
  1, 0, 0, 0, 1, 0, 1, 0,
  1, 0, 0, 0, 1, 0, 1, 0,
  1, 0, 0, 0, 1, 0, 1, 0,
  1, 0, 0, 0, 1, 0, 1, 0,
]

function midiToFreq(m: number) { return 440 * Math.pow(2, (m - 69) / 12) }

function scheduleChipNote(ctx: AudioContext, dest: AudioNode, midi: number, start: number, dur: number, type: OscillatorType, vol: number) {
  if (midi < 0) return
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(midiToFreq(midi), start)
  g.gain.setValueAtTime(0, start)
  g.gain.linearRampToValueAtTime(vol, start + 0.01)
  g.gain.setValueAtTime(vol, start + dur * 0.7)
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur)
  osc.connect(g); g.connect(dest)
  osc.start(start); osc.stop(start + dur + 0.02)
}

function scheduleKick(ctx: AudioContext, dest: AudioNode, start: number) {
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(120, start)
  osc.frequency.exponentialRampToValueAtTime(40, start + 0.12)
  g.gain.setValueAtTime(0.5, start)
  g.gain.exponentialRampToValueAtTime(0.0001, start + 0.14)
  osc.connect(g); g.connect(dest)
  osc.start(start); osc.stop(start + 0.16)
}

function scheduleLoop(ctx: AudioContext, dest: AudioNode, loopStart: number) {
  const totalSteps = LEAD_PATTERN.length
  for (let i = 0; i < totalSteps; i++) {
    const t = loopStart + i * STEP_DURATION
    scheduleChipNote(ctx, dest, LEAD_PATTERN[i], t, STEP_DURATION * 0.9, 'square', 0.18)
  }
  for (let i = 0; i < BASS_PATTERN.length; i++) {
    const t = loopStart + i * STEP_DURATION * 2
    scheduleChipNote(ctx, dest, BASS_PATTERN[i], t, STEP_DURATION * 1.9, 'triangle', 0.25)
  }
  for (let i = 0; i < DRUM_PATTERN.length; i++) {
    if (DRUM_PATTERN[i]) scheduleKick(ctx, dest, loopStart + i * STEP_DURATION)
  }
}

export function startMusic() {
  const ctx = ensureAudio()
  if (!ctx || !musicGain || musicStarted) return
  musicStarted = true
  const loopDuration = LEAD_PATTERN.length * STEP_DURATION
  let nextLoopStart = ctx.currentTime + 0.1
  // Schedule the first two loops up front, then keep scheduling ahead via timer
  scheduleLoop(ctx, musicGain, nextLoopStart); nextLoopStart += loopDuration
  scheduleLoop(ctx, musicGain, nextLoopStart); nextLoopStart += loopDuration

  musicTimer = window.setInterval(() => {
    if (!audioCtx || !musicGain || !musicStarted) return
    // Always keep one loop scheduled ahead of currentTime
    while (nextLoopStart < audioCtx.currentTime + loopDuration) {
      scheduleLoop(audioCtx, musicGain, nextLoopStart)
      nextLoopStart += loopDuration
    }
  }, (loopDuration * 1000) / 2)
}

export function stopMusic() {
  if (!musicStarted) return
  if (musicTimer !== null) { clearInterval(musicTimer); musicTimer = null }
  // Notes already scheduled will play out briefly; cut volume to fade fast
  if (musicGain && audioCtx) {
    try {
      musicGain.gain.cancelScheduledValues(audioCtx.currentTime)
      musicGain.gain.setValueAtTime(musicGain.gain.value, audioCtx.currentTime)
      musicGain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.2)
      // Restore baseline after a moment so a future startMusic works
      setTimeout(() => {
        if (musicGain && !musicStarted) {
          musicGain.gain.value = meta.settings.muted ? 0 : meta.settings.musicVolume * 0.4
        }
      }, 300)
    } catch (_) { /* ignore */ }
  }
  musicStarted = false
}

// Difficulty multipliers (applied on top of campaign multipliers in skirmish)
export function difficultyMult() {
  switch (meta.settings.difficulty) {
    case 'easy':   return { hp: 0.8, dmg: 0.9, income: 0.85 }
    case 'hard':   return { hp: 1.3, dmg: 1.2, income: 1.25 }
    default:       return { hp: 1.0, dmg: 1.0, income: 1.0 }
  }
}

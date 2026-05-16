import { ref, reactive } from 'vue'
import type { Base, Bullet, EntityType, CardType } from '../types/game'
import { BUILDING_TYPES, BUILDING_LIMITS, COSTS } from '../types/game'

// ── State ──
export const money = ref(500)
export const enemyMoney = ref(500)
export const incomePerSecond = ref(15)
export const enemyIncomePerSecond = ref(15)
export const waveNum = ref(1)
export const gameRunning = ref(true)
export const orbitalActive = ref(false)
export const shieldActive = ref(false)
export const shieldTimer = ref(0)
export const empActive = ref(false)
export const empTimer = ref(0)
export const notifMessage = ref('')
export const notifVisible = ref(false)
export const endScreenVisible = ref(false)
export const endTitle = ref('')
export const endWon = ref(false)

export const playerBase: Base = reactive({ x: 100, y: 0, hp: 2500, maxHp: 2500, color: '#00ffaa' })
export const enemyBase: Base = reactive({ x: 0, y: 0, hp: 2500, maxHp: 2500, color: '#ff3344' })

export const units: any[] = []
export const bullets: Bullet[] = []
export const particles: any[] = []
export const floatingTexts: any[] = []

let time = 0
let selectedUnit: any = null
let notifTimer: ReturnType<typeof setTimeout> | null = null
let canvasRef: HTMLCanvasElement | null = null
let ctxRef: CanvasRenderingContext2D | null = null
let bottomPanelHeightRef = 0
let viewportWidth = window.innerWidth
let viewportHeight = window.innerHeight
let resizeHandler: (() => void) | null = null
let mouseDownHandler: ((e: MouseEvent) => void) | null = null

export function getBuildingCount(type: string, team: string) {
  return units.filter(u => u.type === type && u.team === team).length
}

export function showNotif(msg: string) {
  notifMessage.value = msg
  notifVisible.value = true
  if (notifTimer) clearTimeout(notifTimer)
  notifTimer = setTimeout(() => { notifVisible.value = false }, 2000)
}

export function hpPercent() {
  return Math.ceil(Math.max(0, playerBase.hp) / playerBase.maxHp * 100)
}

export function enemyHpPercent() {
  return Math.ceil(Math.max(0, enemyBase.hp) / enemyBase.maxHp * 100)
}

export function isCardDisabled(type: CardType): boolean {
  if (money.value < COSTS[type]) return true
  if (BUILDING_TYPES.has(type as EntityType)) {
    return getBuildingCount(type, 'player') >= (BUILDING_LIMITS[type] || 5)
  }
  return false
}

export function buildingLimitPercent(type: string): number {
  const limit = BUILDING_LIMITS[type]
  if (!limit) return 0
  return (getBuildingCount(type, 'player') / limit) * 100
}

// ── Particle class ──
class Particle {
  x: number; y: number; vx: number; vy: number
  color: string; life: number; decay: number
  constructor(x: number, y: number, color: string, spd = 1) {
    this.x = x; this.y = y
    const a = Math.random() * Math.PI * 2, s = (Math.random() * 3 + 1) * spd
    this.vx = Math.cos(a) * s; this.vy = Math.sin(a) * s
    this.color = color; this.life = 1
    this.decay = Math.random() * 0.03 + 0.02
  }
  update() { this.x += this.vx; this.y += this.vy; this.life -= this.decay }
  draw(ctx: CanvasRenderingContext2D) {
    ctx.globalAlpha = Math.max(0, this.life)
    ctx.fillStyle = this.color; ctx.fillRect(this.x, this.y, 3, 3)
    ctx.globalAlpha = 1
  }
}

class FloatingText {
  x: number; y: number; text: string; color: string; life: number; vy: number
  constructor(x: number, y: number, text: string, color: string) {
    this.x = x + (Math.random() * 20 - 10); this.y = y - 15
    this.text = text; this.color = color; this.life = 1; this.vy = -1.5
  }
  update() { this.y += this.vy; this.life -= 0.025 }
  draw(ctx: CanvasRenderingContext2D) {
    ctx.globalAlpha = Math.max(0, this.life)
    ctx.fillStyle = this.color
    ctx.font = "bold 15px 'Share Tech Mono'"
    ctx.textAlign = 'center'; ctx.fillText(this.text, this.x, this.y)
    ctx.globalAlpha = 1
  }
}

// ── Unit class ──
class Unit {
  team: string; type: string; x: number; y: number
  angle: number; fireCooldown: number; repairSlot: number; stunTimer: number
  hp: number; maxHp: number; speed: number; range: number; radius: number; fireRate: number
  color: string; radarBuff: boolean

  constructor(x: number, y: number, team: string, type: string) {
    this.team = team; this.type = type
    this.angle = team === 'player' ? 0 : Math.PI
    this.fireCooldown = 0; this.repairSlot = Math.random() * Math.PI * 2; this.stunTimer = 0

    const s: Record<string, any> = {
      interceptor: { hp: 60, speed: 2.4, range: 180, radius: 10, fireRate: 35 },
      repair_drone: { hp: 40, speed: 2.5, range: 60, radius: 8, fireRate: 0 },
      sniper: { hp: 40, speed: 0.8, range: 500, radius: 10, fireRate: 160 },
      bomber: { hp: 150, speed: 1.0, range: 300, radius: 15, fireRate: 100 },
      tank: { hp: 600, speed: 0.6, range: 120, radius: 22, fireRate: 80 },
      scout: { hp: 30, speed: 3.5, range: 140, radius: 7, fireRate: 50 },
      medic: { hp: 80, speed: 1.5, range: 100, radius: 10, fireRate: 0 },
      turret: { hp: 400, speed: 0, range: 350, radius: 16, fireRate: 40 },
      bunker: { hp: 1200, speed: 0, range: 150, radius: 24, fireRate: 60 },
      generator: { hp: 200, speed: 0, range: 0, radius: 14, fireRate: 0 },
      radar: { hp: 150, speed: 0, range: 0, radius: 12, fireRate: 0 },
      wall: { hp: 2000, speed: 0, range: 0, radius: 20, fireRate: 0 },
    }
    const stats = s[type] || { hp: 60, speed: 2, range: 180, radius: 10, fireRate: 35 }
    this.hp = stats.hp; this.maxHp = stats.hp; this.speed = stats.speed
    this.range = stats.range; this.radius = stats.radius; this.fireRate = stats.fireRate

    const colors: Record<string, string> = {
      interceptor: team === 'player' ? '#00ffaa' : '#ff3344',
      repair_drone: '#00d4ff', sniper: '#00ffcc', bomber: '#ffaa00',
      tank: team === 'player' ? '#ff6622' : '#ff4444',
      scout: '#aaff00', medic: '#ff88ff', turret: '#b000ff', bunker: '#888899',
      generator: '#ffd700', radar: '#00ffff', wall: '#778866',
    }
    this.color = colors[type] || '#00ffaa'
    this.radarBuff = false

    if (BUILDING_TYPES.has(type as EntityType)) {
      const sign = team === 'player' ? 1 : -1
      const bx = team === 'player' ? playerBase.x : enemyBase.x
      const by = team === 'player' ? playerBase.y : enemyBase.y
      const spread = getBuildingCount(type, team) * 40 - 60
      if (type === 'turret') { this.x = bx + sign * 80 + Math.random() * 50; this.y = by + (Math.random() - 0.5) * 350 }
      else if (type === 'wall') { this.x = bx + sign * 140 + Math.random() * 30; this.y = by + spread }
      else if (type === 'bunker') { this.x = bx + sign * 120 + Math.random() * 40; this.y = by + (Math.random() - 0.5) * 200 }
      else if (type === 'generator') { this.x = bx + sign * 60 + Math.random() * 30; this.y = by - 80 + getBuildingCount(type, team) * 40 }
      else if (type === 'radar') { this.x = bx + sign * 70; this.y = by + (team === 'player' ? 1 : -1) * 100 }
      else { this.x = bx + sign * 80; this.y = by + (Math.random() - 0.5) * 200 }
    } else {
      this.x = x; this.y = y
    }

    if (type === 'generator') {
      if (team === 'player') incomePerSecond.value += 8
      else enemyIncomePerSecond.value += 8
    }
  }

  clampToViewport() {
    this.x = Math.max(this.radius, Math.min(viewportWidth - this.radius, this.x))
    this.y = Math.max(this.radius, Math.min(viewportHeight - this.radius, this.y))
  }

  update(ctx: CanvasRenderingContext2D) {
    if (this.team === 'enemy' && empActive.value) return
    if (this.stunTimer > 0) { this.stunTimer--; return }
    if (this.speed === 0 && this.type !== 'turret' && this.type !== 'bunker') return

    const target = this.type === 'repair_drone' || this.type === 'medic'
      ? (this.team === 'player' ? playerBase : enemyBase)
      : this.findTarget()
    let tx = target.x, ty = target.y

    if (this.type === 'repair_drone') {
      tx = target.x + Math.cos(this.repairSlot) * 75
      ty = target.y + Math.sin(this.repairSlot) * 75
    }
    if (this.type === 'medic') {
      const allies = units.filter(u => u.team === this.team && u !== this && u.hp < u.maxHp && !BUILDING_TYPES.has(u.type))
      if (allies.length) {
        const nearest = allies.reduce((a: any, b: any) => Math.hypot(a.x - this.x, a.y - this.y) < Math.hypot(b.x - this.x, b.y - this.y) ? a : b)
        tx = nearest.x; ty = nearest.y
        if (Math.hypot(tx - this.x, ty - this.y) < 40) {
          nearest.hp = Math.min(nearest.maxHp, nearest.hp + 0.6)
          ctx.beginPath(); ctx.strokeStyle = 'rgba(255,136,255,0.5)'; ctx.lineWidth = 1.5
          ctx.moveTo(this.x, this.y); ctx.lineTo(nearest.x, nearest.y); ctx.stroke()
        }
      }
    }

    const dx = tx - this.x, dy = ty - this.y, dist = Math.hypot(dx, dy)
    const angleToTarget = Math.atan2(dy, dx)
    let diff = angleToTarget - this.angle
    while (diff < -Math.PI) diff += Math.PI * 2
    while (diff > Math.PI) diff -= Math.PI * 2

    if (this.type === 'turret' || this.type === 'bunker') this.angle = angleToTarget
    else this.angle += diff * 0.15

    if (this.speed > 0) {
      units.forEach(other => {
        if (other === this || other.speed === 0) return
        const d = Math.hypot(this.x - other.x, this.y - other.y)
        const min = this.radius + other.radius + 8
        if (d < min) {
          const ov = min - d, a = Math.atan2(this.y - other.y, this.x - other.x)
          this.x += Math.cos(a) * ov * 0.2; this.y += Math.sin(a) * ov * 0.2
        }
      })
      const stop = this.type === 'repair_drone' || this.type === 'medic' ? 10 : this.range * 0.8
      if (dist > stop) { this.x += Math.cos(this.angle) * this.speed; this.y += Math.sin(this.angle) * this.speed }
    }

    this.clampToViewport()

    this.radarBuff = false
    if (this.team === 'player') {
      units.forEach(r => {
        if (r.type === 'radar' && r.team === 'player' && Math.hypot(r.x - this.x, r.y - this.y) < 200) this.radarBuff = true
      })
    }

    if (this.type === 'repair_drone') {
      const base = this.team === 'player' ? playerBase : enemyBase
      if (dist < 150 && base.hp < base.maxHp) {
        base.hp = Math.min(base.maxHp, base.hp + 0.8)
        ctx.beginPath(); ctx.strokeStyle = 'rgba(0,212,255,0.6)'; ctx.lineWidth = 2
        ctx.moveTo(this.x, this.y); ctx.lineTo(base.x, base.y); ctx.stroke()
      }
    } else if (this.type === 'generator' || this.type === 'wall' || this.type === 'radar') {
      // passive
    } else if (dist < this.range && this.fireCooldown <= 0) {
      if (Math.abs(diff) < 0.5 || this.type === 'turret' || this.type === 'bunker') {
        this.shoot(); this.fireCooldown = this.fireRate
      }
    }
    if (this.fireCooldown > 0) this.fireCooldown--
  }

  findTarget(): { x: number; y: number } {
    const enemies = this.team === 'player'
      ? units.filter(u => u.team === 'enemy')
      : units.filter(u => u.team === 'player')
    if (enemies.length) {
      return enemies.reduce((p: any, c: any) => Math.hypot(p.x - this.x, p.y - this.y) < Math.hypot(c.x - this.x, c.y - this.y) ? p : c)
    }
    return this.team === 'player' ? enemyBase : playerBase
  }

  shoot() {
    let dmg = 15, bs = 8, bsz = 3
    if (this.type === 'bomber') { dmg = 60; bs = 5; bsz = 6 }
    else if (this.type === 'tank') { dmg = 30; bs = 9; bsz = 4 }
    else if (this.type === 'turret') { dmg = 25; bs = 12; bsz = 4 }
    else if (this.type === 'sniper') { dmg = 100; bs = 18; bsz = 2 }
    else if (this.type === 'scout') { dmg = 8; bs = 12; bsz = 2 }
    else if (this.type === 'bunker') { dmg = 20; bs = 10; bsz = 5 }
    if (this.radarBuff) dmg = Math.ceil(dmg * 1.15)
    bullets.push({
      x: this.x + Math.cos(this.angle) * this.radius,
      y: this.y + Math.sin(this.angle) * this.radius,
      vx: Math.cos(this.angle) * bs, vy: Math.sin(this.angle) * bs,
      team: this.team as any, damage: dmg, size: bsz, type: this.type as EntityType,
    })
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this === selectedUnit || (this.type === 'turret' && this.team === 'player') || this.type === 'radar') {
      ctx.save(); ctx.beginPath(); ctx.arc(this.x, this.y, this.range || 100, 0, Math.PI * 2)
      ctx.strokeStyle = this.type === 'radar' ? 'rgba(0,255,255,0.2)' : 'rgba(255,255,255,0.15)'
      ctx.fillStyle = this.type === 'radar' ? 'rgba(0,255,255,0.03)' : 'rgba(255,255,255,0.03)'
      ctx.lineWidth = 1; ctx.fill(); ctx.stroke(); ctx.restore()
    }
    const stunFlash = this.stunTimer > 0 && Math.floor(this.stunTimer / 5) % 2 === 0
    const shouldSnapToPixelGrid = this.speed > 0
    const drawX = shouldSnapToPixelGrid ? Math.round(this.x) : this.x
    const drawY = shouldSnapToPixelGrid ? Math.round(this.y) : this.y
    ctx.save(); ctx.translate(drawX, drawY); ctx.rotate(this.angle)
    const baseShadowBlur = shouldSnapToPixelGrid ? 0 : 10
    ctx.shadowBlur = stunFlash ? 20 : baseShadowBlur; ctx.shadowColor = stunFlash ? '#ffff00' : this.color
    ctx.strokeStyle = stunFlash ? '#ffff00' : this.color; ctx.fillStyle = stunFlash ? '#ffff00' : this.color
    ctx.lineWidth = 2

    ctx.fillStyle = 'rgba(255,0,0,0.5)'; ctx.fillRect(-15, -this.radius - 8, 30, 3)
    ctx.fillStyle = this.hp / this.maxHp > 0.5 ? '#0f0' : (this.hp / this.maxHp > 0.25 ? '#fa0' : '#f00')
    ctx.fillRect(-15, -this.radius - 8, 30 * (this.hp / this.maxHp), 3)
    ctx.strokeStyle = stunFlash ? '#ffff00' : this.color
    ctx.fillStyle = stunFlash ? 'rgba(255,255,0,0.1)' : this.color

    switch (this.type) {
      case 'repair_drone':
        ctx.strokeRect(-6, -6, 12, 12)
        ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(0, 9); ctx.moveTo(-9, 0); ctx.lineTo(9, 0); ctx.stroke()
        break
      case 'interceptor':
        ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(-10, -8); ctx.lineTo(-6, 0); ctx.lineTo(-10, 8); ctx.closePath(); ctx.stroke()
        break
      case 'scout':
        ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-7, -4); ctx.lineTo(-4, 0); ctx.lineTo(-7, 4); ctx.closePath(); ctx.stroke()
        ctx.globalAlpha = 0.5
        ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(-12, -3); ctx.lineTo(-10, 0); ctx.lineTo(-12, 3); ctx.closePath(); ctx.stroke()
        ctx.globalAlpha = 1
        break
      case 'sniper':
        ctx.beginPath(); ctx.moveTo(20, 0); ctx.lineTo(-12, -4); ctx.lineTo(-12, 4); ctx.closePath(); ctx.stroke()
        ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.stroke()
        break
      case 'bomber':
        ctx.strokeRect(-12, -12, 24, 24)
        ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(-12, -18); ctx.moveTo(12, 0); ctx.lineTo(-12, 18); ctx.stroke()
        break
      case 'tank':
        ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.stroke()
        ctx.fillRect(0, -5, 22, 10); ctx.strokeRect(-18, -18, 36, 36); ctx.lineWidth = 2
        break
      case 'medic':
        ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.stroke()
        ctx.lineWidth = 2.5
        ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(0, 7); ctx.moveTo(-7, 0); ctx.lineTo(7, 0); ctx.stroke()
        break
      case 'turret':
        ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(25, -5); ctx.lineTo(25, 5); ctx.lineTo(0, 5); ctx.stroke()
        ctx.globalAlpha = 0.3; ctx.fill(); ctx.globalAlpha = 1
        break
      case 'bunker':
        ctx.lineWidth = 3; ctx.strokeRect(-24, -18, 48, 36)
        ctx.globalAlpha = 0.15; ctx.fillRect(-24, -18, 48, 36); ctx.globalAlpha = 1
        ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-8, -18); ctx.lineTo(-8, 18); ctx.moveTo(8, -18); ctx.lineTo(8, 18); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(28, -5); ctx.lineTo(28, 5); ctx.lineTo(0, 5); ctx.stroke()
        break
      case 'generator':
        ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.stroke()
        ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.globalAlpha = 0.2; ctx.fill(); ctx.globalAlpha = 1; ctx.stroke()
        ctx.beginPath(); ctx.moveTo(4, -10); ctx.lineTo(-2, 0); ctx.lineTo(4, 0); ctx.lineTo(-4, 10); ctx.lineWidth = 2.5; ctx.stroke()
        break
      case 'radar': {
        const rAngle = Date.now() / 600
        for (const r of [14, 8]) { ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.globalAlpha = r === 14 ? 0.5 : 0.7; ctx.stroke(); ctx.globalAlpha = 1 }
        ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.globalAlpha = 0.3; ctx.fill(); ctx.globalAlpha = 1
        ctx.save(); ctx.rotate(rAngle)
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(12, -7); ctx.lineWidth = 2.5; ctx.stroke()
        ctx.restore()
        break
      }
      case 'wall':
        ctx.lineWidth = 4; ctx.strokeRect(-20, -8, 40, 16)
        ctx.globalAlpha = 0.15; ctx.fillRect(-20, -8, 40, 16); ctx.globalAlpha = 1
        ctx.lineWidth = 1; ctx.globalAlpha = 0.5
        for (let i = -10; i <= 10; i += 10) { ctx.beginPath(); ctx.moveTo(i, -8); ctx.lineTo(i, 8); ctx.stroke() }
        ctx.globalAlpha = 1
        break
    }
    ctx.restore()
  }
}

// ── Drawing helpers ──
function drawBackground(ctx: CanvasRenderingContext2D) {
  time += 0.5
  ctx.strokeStyle = 'rgba(0,255,65,0.04)'; ctx.lineWidth = 1; ctx.beginPath()
  const gs = 50, ox = time % gs
  for (let x = ox; x < viewportWidth; x += gs) { ctx.moveTo(x, 0); ctx.lineTo(x, viewportHeight) }
  for (let y = 0; y < viewportHeight; y += gs) { ctx.moveTo(0, y); ctx.lineTo(viewportWidth, y) }
  ctx.stroke()
  ctx.strokeStyle = 'rgba(255,100,50,0.06)'; ctx.lineWidth = 1; ctx.beginPath()
  ctx.moveTo(viewportWidth / 2, 0); ctx.lineTo(viewportWidth / 2, viewportHeight); ctx.stroke()
}

function drawBase(ctx: CanvasRenderingContext2D, base: Base, isPlayer: boolean) {
  ctx.save(); ctx.translate(base.x, base.y)
  ctx.strokeStyle = base.color; ctx.lineWidth = 3; ctx.shadowBlur = 20; ctx.shadowColor = base.color

  if (isPlayer && shieldActive.value) {
    ctx.beginPath(); ctx.arc(0, 0, 80, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(68,136,255,0.8)'; ctx.lineWidth = 4
    ctx.shadowColor = '#4488ff'; ctx.shadowBlur = 20; ctx.stroke()
    ctx.lineWidth = 3; ctx.strokeStyle = base.color; ctx.shadowColor = base.color
  }

  ctx.rotate(time * 0.01 * (isPlayer ? 1 : -1)); ctx.beginPath()
  for (let i = 0; i < 6; i++) ctx.lineTo(Math.cos(i * Math.PI / 3) * 55, Math.sin(i * Math.PI / 3) * 55)
  ctx.closePath(); ctx.stroke()
  ctx.rotate(-time * 0.01 * (isPlayer ? 1 : -1))

  ctx.beginPath(); ctx.arc(0, 0, 20 + Math.sin(Date.now() / 200) * 8, 0, Math.PI * 2)
  ctx.fillStyle = base.color; ctx.globalAlpha = 0.4; ctx.fill(); ctx.globalAlpha = 1; ctx.stroke()

  const pct = base.hp / base.maxHp
  ctx.fillStyle = '#222'; ctx.shadowBlur = 0; ctx.fillRect(-60, -85, 120, 8)
  ctx.fillStyle = pct > 0.5 ? '#0f0' : (pct > 0.25 ? '#fa0' : '#f00')
  ctx.fillRect(-60, -85, pct * 120, 8)
  ctx.restore()
}

// ── Actions ──
export function spawnUnit(type: string) {
  if (money.value < COSTS[type as CardType]) { showNotif('⚠ Crédits insuffisants'); return }
  if (BUILDING_TYPES.has(type as EntityType)) {
    const limit = BUILDING_LIMITS[type] || 5
    const count = getBuildingCount(type, 'player')
    if (count >= limit) { showNotif(`⚠ Limite ${type} atteinte (${limit})`); return }
  }
  money.value -= COSTS[type as CardType]
  units.push(new Unit(playerBase.x, playerBase.y, 'player', type))
}

export function toggleOrbital() {
  if (money.value < COSTS.orbital) { showNotif('⚠ Crédits insuffisants'); return }
  orbitalActive.value = !orbitalActive.value
  if (canvasRef) canvasRef.style.cursor = orbitalActive.value ? 'crosshair' : 'default'
}

function triggerOrbitalStrike(x: number, y: number) {
  money.value -= COSTS.orbital
  orbitalActive.value = false
  if (canvasRef) canvasRef.style.cursor = 'default'
  for (let p = 0; p < 100; p++) particles.push(new Particle(x, y, '#ff00aa', 6))
  for (let p = 0; p < 30; p++) particles.push(new Particle(x, y, '#ffffff', 4))
  units.forEach(u => {
    if (u.team === 'enemy' && Math.hypot(u.x - x, u.y - y) < 150) {
      u.hp -= 400
      floatingTexts.push(new FloatingText(u.x, u.y, '-400', '#ff00aa'))
      if (u.hp <= 0) money.value += 25
    }
  })
}

export function activateShield() {
  if (money.value < COSTS.shield) { showNotif('⚠ Crédits insuffisants'); return }
  money.value -= COSTS.shield
  shieldActive.value = true; shieldTimer.value = 480
  showNotif('🛡 BOUCLIER ACTIF — 8s')
}

export function activateEMP() {
  if (money.value < COSTS.emp) { showNotif('⚠ Crédits insuffisants'); return }
  money.value -= COSTS.emp
  empActive.value = true; empTimer.value = 180
  showNotif('⚡ EMP DÉCLENCHÉ — Tous les ennemis paralysés !')
  for (const u of units) {
    if (u.team === 'enemy') {
      for (let p = 0; p < 10; p++) particles.push(new Particle(u.x, u.y, '#ffff00', 3))
    }
  }
  if (canvasRef) {
    for (let p = 0; p < 80; p++) particles.push(new Particle(viewportWidth / 2, viewportHeight / 2, '#ffff00', 8))
  }
}

// ── Game loop ──
function gameLoop() {
  const ctx = ctxRef!

  ctx.fillStyle = 'rgba(5,5,16,0.4)'
  ctx.fillRect(0, 0, viewportWidth, viewportHeight)
  drawBackground(ctx)
  drawBase(ctx, playerBase, true)
  drawBase(ctx, enemyBase, false)

  if (shieldActive.value) {
    shieldTimer.value--
    if (shieldTimer.value <= 0) { shieldActive.value = false; showNotif('🛡 Bouclier épuisé') }
  }
  if (empActive.value) {
    empTimer.value--
    if (empTimer.value <= 0) empActive.value = false
  }

  // Bullets
  for (let bi = bullets.length - 1; bi >= 0; bi--) {
    const b = bullets[bi]
    b.x += b.vx; b.y += b.vy
    const bColor = b.team === 'player' ? (b.type === 'sniper' ? '#00ffcc' : '#ffffff') : '#ffaa00'
    ctx.shadowBlur = 10; ctx.shadowColor = bColor; ctx.fillStyle = bColor
    ctx.fillRect(b.x, b.y, b.size, b.size); ctx.shadowBlur = 0

    let hit = false
    for (const u of units) {
      if (u.team !== b.team && Math.hypot(u.x - b.x, u.y - b.y) < u.radius + b.size) {
        let dmg = b.damage
        if (u.type === 'wall') dmg = Math.ceil(dmg * 0.5)
        u.hp -= dmg
        floatingTexts.push(new FloatingText(u.x, u.y, `-${dmg}`, b.team === 'player' ? '#fff' : '#ff3344'))
        hit = true
        if (u.hp <= 0 && b.team === 'player') money.value += u.type === 'tank' ? 40 : (BUILDING_TYPES.has(u.type) ? 50 : 20)
        break
      }
    }
    if (!hit && b.team === 'player' && Math.hypot(enemyBase.x - b.x, enemyBase.y - b.y) < 55) {
      enemyBase.hp -= b.damage; hit = true
    }
    if (!hit && b.team === 'enemy' && Math.hypot(playerBase.x - b.x, playerBase.y - b.y) < 55) {
      let dmg = b.damage
      if (shieldActive.value) dmg = Math.ceil(dmg * 0.2)
      playerBase.hp -= dmg; hit = true
    }
    if (hit || b.x < 0 || b.x > viewportWidth || b.y < 0 || b.y > viewportHeight) {
      if (hit) for (let k = 0; k < 3; k++) particles.push(new Particle(b.x, b.y, bColor))
      bullets.splice(bi, 1)
    }
  }

  // Dead units
  for (let i = units.length - 1; i >= 0; i--) {
    if (units[i].hp <= 0) {
      for (let p = 0; p < 15; p++) particles.push(new Particle(units[i].x, units[i].y, units[i].color))
      if (units[i].type === 'generator') {
        if (units[i].team === 'player') incomePerSecond.value = Math.max(15, incomePerSecond.value - 8)
        else enemyIncomePerSecond.value = Math.max(15, enemyIncomePerSecond.value - 8)
      }
      if (units[i] === selectedUnit) selectedUnit = null
      units.splice(i, 1)
    }
  }

  units.forEach(u => { u.update(ctx); u.draw(ctx) })

  if (empActive.value) {
    ctx.strokeStyle = 'rgba(255,255,0,0.15)'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.arc(viewportWidth / 2, viewportHeight / 2, viewportWidth, 0, Math.PI * 2); ctx.stroke()
    units.filter(u => u.team === 'enemy').forEach(u => {
      if (Math.random() < 0.1) particles.push(new Particle(u.x, u.y, '#ffff00', 1))
    })
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update(); particles[i].draw(ctx)
    if (particles[i].life <= 0) particles.splice(i, 1)
  }
  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    floatingTexts[i].update(); floatingTexts[i].draw(ctx)
    if (floatingTexts[i].life <= 0) floatingTexts.splice(i, 1)
  }

  // Enemy AI
  if (Math.random() < 0.06) {
    let type: string | null = null
    const eDrones = units.filter(u => u.team === 'enemy' && u.type === 'repair_drone').length
    const eTurrets = units.filter(u => u.team === 'enemy' && u.type === 'turret').length
    const eBunkers = units.filter(u => u.team === 'enemy' && u.type === 'bunker').length
    const eGens = units.filter(u => u.team === 'enemy' && u.type === 'generator').length

    if (enemyBase.hp < 1800 && eDrones < 3 && enemyMoney.value >= COSTS.repair_drone) type = 'repair_drone'
    else if (enemyBase.hp < 2000 && eTurrets < 3 && enemyMoney.value >= COSTS.turret && Math.random() > 0.5) type = 'turret'
    else if (waveNum.value >= 2 && eBunkers < 2 && enemyMoney.value >= COSTS.bunker && Math.random() > 0.7) type = 'bunker'
    else if (waveNum.value >= 3 && eGens < 3 && enemyMoney.value >= COSTS.generator && Math.random() > 0.8) type = 'generator'
    else {
      const opts: string[] = ['interceptor', 'bomber', 'tank', 'sniper', 'scout']
      if (waveNum.value >= 2) opts.push('medic')
      const affordable = opts.filter(o => enemyMoney.value >= COSTS[o as CardType])
      if (affordable.length) type = affordable[Math.floor(Math.random() * affordable.length)]
    }
    if (type && enemyMoney.value >= COSTS[type as CardType]) {
      enemyMoney.value -= COSTS[type as CardType]
      units.push(new Unit(enemyBase.x, enemyBase.y, 'enemy', type))
    }
  }

  if (playerBase.hp > 0 && enemyBase.hp > 0) {
    requestAnimationFrame(gameLoop)
  } else {
    gameRunning.value = false
    endWon.value = playerBase.hp > 0
    endTitle.value = endWon.value ? 'VICTOIRE !' : 'DÉFAITE'
    endScreenVisible.value = true
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 0, viewportWidth, viewportHeight)
  }
}

// ── Init ──
let incomeInterval: ReturnType<typeof setInterval> | null = null
let waveInterval: ReturnType<typeof setInterval> | null = null

export function initGame(canvas: HTMLCanvasElement, bottomPanelHeight: number) {
  cleanupGame()

  canvasRef = canvas
  ctxRef = canvas.getContext('2d')!
  bottomPanelHeightRef = bottomPanelHeight

  resizeHandler = () => {
    const prevWidth = viewportWidth || window.innerWidth
    const prevHeight = viewportHeight || (window.innerHeight - bottomPanelHeight - 54)

    viewportWidth = window.innerWidth
    viewportHeight = window.innerHeight - bottomPanelHeight - 54

    const dpr = window.devicePixelRatio || 1
    canvas.style.width = `${viewportWidth}px`
    canvas.style.height = `${viewportHeight}px`
    canvas.width = Math.floor(viewportWidth * dpr)
    canvas.height = Math.floor(viewportHeight * dpr)
    ctxRef!.setTransform(dpr, 0, 0, dpr, 0, 0)

    const ratioX = prevWidth > 0 ? viewportWidth / prevWidth : 1
    const ratioY = prevHeight > 0 ? viewportHeight / prevHeight : 1

    if (units.length || bullets.length || particles.length || floatingTexts.length) {
      units.forEach(u => { u.x *= ratioX; u.y *= ratioY })
      bullets.forEach(b => { b.x *= ratioX; b.y *= ratioY })
      particles.forEach(p => { p.x *= ratioX; p.y *= ratioY })
      floatingTexts.forEach(t => { t.x *= ratioX; t.y *= ratioY })
      units.forEach(u => u.clampToViewport())
    }

    playerBase.x = 100
    playerBase.y = viewportHeight / 2
    enemyBase.x = viewportWidth - 100
    enemyBase.y = viewportHeight / 2
  }
  window.addEventListener('resize', resizeHandler)
  resizeHandler()

  mouseDownHandler = (e: MouseEvent) => {
    if (!gameRunning.value) return
    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left, my = e.clientY - rect.top
    if (orbitalActive.value) { triggerOrbitalStrike(mx, my); return }
    selectedUnit = null
    for (const u of units) {
      if (Math.hypot(u.x - mx, u.y - my) < u.radius + 15) { selectedUnit = u; break }
    }
  }
  canvas.addEventListener('mousedown', mouseDownHandler)

  incomeInterval = setInterval(() => {
    if (!gameRunning.value) return
    money.value += incomePerSecond.value
    enemyMoney.value += enemyIncomePerSecond.value
  }, 1000)

  waveInterval = setInterval(() => {
    if (!gameRunning.value) return
    waveNum.value++
    enemyIncomePerSecond.value = Math.min(40, 15 + waveNum.value * 3)
    showNotif(`⚠ VAGUE ${waveNum.value} — OFFENSIVE ENNEMIE RENFORCÉE`)
  }, 30000)

  gameLoop()
}

export function resetGame() {
  cleanupGame()

  money.value = 500
  enemyMoney.value = 500
  incomePerSecond.value = 15
  enemyIncomePerSecond.value = 15
  waveNum.value = 1
  gameRunning.value = true
  orbitalActive.value = false
  shieldActive.value = false
  shieldTimer.value = 0
  empActive.value = false
  empTimer.value = 0
  notifVisible.value = false
  notifMessage.value = ''
  endScreenVisible.value = false
  endTitle.value = ''
  endWon.value = false

  playerBase.hp = playerBase.maxHp
  enemyBase.hp = enemyBase.maxHp

  units.length = 0
  bullets.length = 0
  particles.length = 0
  floatingTexts.length = 0
  selectedUnit = null
  time = 0

  if (canvasRef) {
    initGame(canvasRef, bottomPanelHeightRef)
  }
}

export function cleanupGame() {
  if (incomeInterval) clearInterval(incomeInterval)
  if (waveInterval) clearInterval(waveInterval)
  incomeInterval = null
  waveInterval = null
  if (notifTimer) {
    clearTimeout(notifTimer)
    notifTimer = null
  }
  if (canvasRef && mouseDownHandler) {
    canvasRef.removeEventListener('mousedown', mouseDownHandler)
    mouseDownHandler = null
  }
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler)
    resizeHandler = null
  }
}

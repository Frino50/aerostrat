<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import {
  TECH_TREE, meta, goTo, playSfx, isUnlocked, canUnlock, unlockNode,
} from '../composables/useMeta'
import type { TechNode } from '../composables/useMeta'
import { UNIT_CARDS, BUILDING_CARDS, SPECIAL_CARDS } from '../data/cards'
import type { CardDef } from '../types/game'

// ── Card-icon lookup (so tech tree icons match in-game card icons) ──
const ALL_CARDS: CardDef[] = [...UNIT_CARDS, ...BUILDING_CARDS, ...SPECIAL_CARDS]
function cardFor(n: TechNode): CardDef | null {
  if (!n.unlocks) return null
  return ALL_CARDS.find(c => c.id === n.unlocks) || null
}

// ── Circular (Path of Exile-like) layout ──
type Category = 'units' | 'support' | 'buildings' | 'powers' | 'bonus'
function categoryOf(n: TechNode): Category {
  if (n.id === 'root') return 'units'
  if (['scout', 'sniper', 'bomber', 'tank'].includes(n.id)) return 'units'
  if (['repair', 'medic'].includes(n.id)) return 'support'
  if (['wall', 'turret', 'generator', 'radar', 'bunker'].includes(n.id)) return 'buildings'
  if (['shield', 'emp', 'orbital'].includes(n.id)) return 'powers'
  return 'bonus'
}

const CATEGORY_ANGLES: Record<Category, number> = {
  units:     Math.PI / 2,
  buildings: -Math.PI / 2,
  bonus:     0,
  powers:    Math.PI,
  support:   3 * Math.PI / 4,
}

interface Pos { x: number; y: number; depth: number }

const positions = computed<Record<string, Pos>>(() => {
  const out: Record<string, Pos> = {}
  out['root'] = { x: 0, y: 0, depth: 0 }

  const groups: Record<Category, TechNode[]> = {
    units: [], buildings: [], bonus: [], powers: [], support: [],
  }
  for (const n of TECH_TREE) {
    if (n.id === 'root') continue
    groups[categoryOf(n)].push(n)
  }

  const RING = 230
  const SPREAD = 0.55

  for (const cat of Object.keys(groups) as Category[]) {
    const baseAngle = CATEGORY_ANGLES[cat]
    const byDepth: Record<number, TechNode[]> = {}
    for (const n of groups[cat]) {
      const d = Math.max(1, n.col)
      ;(byDepth[d] ||= []).push(n)
    }
    for (const dStr of Object.keys(byDepth)) {
      const d = Number(dStr)
      const arr = byDepth[d]
      arr.sort((a, b) => a.row - b.row)
      const n = arr.length
      arr.forEach((node, i) => {
        const offset = (i - (n - 1) / 2) * SPREAD
        const angle = baseAngle + offset
        const r = d * RING
        out[node.id] = { x: Math.cos(angle) * r, y: Math.sin(angle) * r, depth: d }
      })
    }
  }
  return out
})

// Rayon visuel d'un nœud (doit correspondre au CSS .tree-node.circular: width/2 = 60)
const NODE_RADIUS = 60

interface Link { x1: number; y1: number; x2: number; y2: number; active: boolean }
const links = computed<Link[]>(() => {
  const arr: Link[] = []
  const pos = positions.value
  for (const n of TECH_TREE) {
    for (const reqId of n.requires) {
      const p1 = pos[reqId]; const p2 = pos[n.id]
      if (!p1 || !p2) continue
      // Raccourcir la ligne pour qu'elle s'arrête au bord du cercle (pas à l'intérieur)
      const dx = p2.x - p1.x, dy = p2.y - p1.y
      const len = Math.hypot(dx, dy) || 1
      const ux = dx / len, uy = dy / len
      arr.push({
        x1: p1.x + ux * NODE_RADIUS,
        y1: p1.y + uy * NODE_RADIUS,
        x2: p2.x - ux * NODE_RADIUS,
        y2: p2.y - uy * NODE_RADIUS,
        active: isUnlocked(reqId) && isUnlocked(n.id),
      })
    }
  }
  return arr
})

// Anneaux dynamiques : un anneau par profondeur utilisée
const RING_RADIUS = 230
const rings = computed<number[]>(() => {
  let maxDepth = 0
  for (const p of Object.values(positions.value)) {
    if (p.depth > maxDepth) maxDepth = p.depth
  }
  const out: number[] = []
  for (let d = 1; d <= maxDepth; d++) out.push(d * RING_RADIUS)
  return out
})

function state(n: TechNode): 'unlocked' | 'available' | 'locked' {
  if (isUnlocked(n.id)) return 'unlocked'
  if (canUnlock(n)) return 'available'
  return 'locked'
}

function tryUnlock(n: TechNode) {
  if (isUnlocked(n.id)) { playSfx('hover'); return }
  unlockNode(n.id)
}

const SVG_HALF = 1800

// ── Pan (drag to move) ──
const pan = ref({ x: 0, y: 0 })
const dragging = ref(false)
const dragStart = { x: 0, y: 0, panX: 0, panY: 0 }

function onPointerDown(e: PointerEvent) {
  // Ne pas démarrer un drag si on clique sur un nœud
  const target = e.target as HTMLElement
  if (target.closest('.tree-node')) return
  dragging.value = true
  dragStart.x = e.clientX; dragStart.y = e.clientY
  dragStart.panX = pan.value.x; dragStart.panY = pan.value.y
  ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
}
function onPointerMove(e: PointerEvent) {
  if (!dragging.value) return
  pan.value = {
    x: dragStart.panX + (e.clientX - dragStart.x),
    y: dragStart.panY + (e.clientY - dragStart.y),
  }
}
function onPointerUp(e: PointerEvent) {
  dragging.value = false
  ;(e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId)
}

function recenter() { pan.value = { x: 0, y: 0 } }

function onKey(e: KeyboardEvent) {
  const step = 80
  if (e.key === 'ArrowLeft')  pan.value = { x: pan.value.x + step, y: pan.value.y }
  if (e.key === 'ArrowRight') pan.value = { x: pan.value.x - step, y: pan.value.y }
  if (e.key === 'ArrowUp')    pan.value = { x: pan.value.x, y: pan.value.y + step }
  if (e.key === 'ArrowDown')  pan.value = { x: pan.value.x, y: pan.value.y - step }
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="menu-screen tree-screen tree-screen-full">
    <div class="menu-content panel-screen fullscreen tree-fullpage">
      <div class="tree-topbar tree-topbar-min">
        <button class="back-btn" @click="goTo('menu')">← RETOUR</button>
        <button class="back-btn recenter-btn" @click="recenter">⟲ RECENTRER</button>
        <div class="xp-badge">XP : <b>{{ meta.xp }}</b></div>
      </div>
      <div
        class="tree-viewport circular"
        :class="{ grabbing: dragging }"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
      >
        <div class="tree-canvas circular"
             :style="{ transform: `translate(${pan.x}px, ${pan.y}px)` }">
          <svg class="tree-rings" :width="SVG_HALF * 2" :height="SVG_HALF * 2"
               :viewBox="`${-SVG_HALF} ${-SVG_HALF} ${SVG_HALF * 2} ${SVG_HALF * 2}`"
               :style="{ left: -SVG_HALF + 'px', top: -SVG_HALF + 'px' }">
            <circle v-for="r in rings" :key="r"
                    cx="0" cy="0" :r="r"
                    fill="none" stroke="rgba(0,255,65,0.18)" stroke-dasharray="3,4" />
            <line
              v-for="(l, i) in links" :key="'l' + i"
              :x1="l.x1" :y1="l.y1" :x2="l.x2" :y2="l.y2"
              :stroke="l.active ? '#00ff41' : 'rgba(0,255,65,0.2)'"
              stroke-width="2"
            />
          </svg>

          <div
            v-for="n in TECH_TREE" :key="n.id"
            class="tree-node circular"
            :class="state(n)"
            :style="{ left: positions[n.id].x + 'px', top: positions[n.id].y + 'px' }"
            @click="tryUnlock(n)"
            @mouseenter="playSfx('hover')"
          >
            <div class="node-icon-wrap">
              <svg v-if="cardFor(n)" :viewBox="cardFor(n)!.svgViewBox" v-html="cardFor(n)!.svgContent" />
              <span v-else class="node-emoji">{{ n.icon }}</span>
            </div>
            <div class="node-label">
              <div class="node-name">{{ n.name }}</div>
              <div v-if="state(n) !== 'unlocked'" class="node-cost">{{ n.cost }} XP</div>
            </div>
            <div class="node-tooltip">
              <div class="tip-title">{{ n.name }}</div>
              <div class="tip-desc">{{ n.desc }}</div>
              <div class="tip-cost" v-if="state(n) !== 'unlocked'">Coût : {{ n.cost }} XP</div>
              <div class="tip-state" v-if="state(n) === 'locked'">Prérequis non remplis</div>
              <div class="tip-state available" v-else-if="state(n) === 'available'">Disponible — clique pour débloquer</div>
              <div class="tip-state unlocked" v-else>Débloqué</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CardDef } from '../types/game'
import { BUILDING_LIMITS } from '../types/game'
import { isCardDisabled, buildingLimitPercent, orbitalActive } from '../composables/useGame'
import { TOOLTIPS } from '../types/game'

const props = defineProps<{
  card: CardDef
}>()

const emit = defineEmits<{
  action: [id: string]
}>()

function onMouseEnter(e: MouseEvent) {
  const t = TOOLTIPS[props.card.id]
  if (!t) return
  const tt = document.getElementById('tooltip')!
  document.getElementById('tt-title')!.textContent = t.name
  document.getElementById('tt-desc')!.textContent = t.desc
  const x = Math.min(e.clientX + 12, window.innerWidth - 220)
  const y = e.clientY - 80
  tt.style.left = x + 'px'
  tt.style.top = y + 'px'
  tt.classList.add('show')
}

function onMouseLeave() {
  document.getElementById('tooltip')!.classList.remove('show')
}

const hasLimit = BUILDING_LIMITS[props.card.id] !== undefined
</script>

<template>
  <div
    class="card"
    :class="{
      disabled: isCardDisabled(card.id),
      special: card.type === 'special',
      'full-width': card.fullWidth,
      'active-ability': card.id === 'orbital' && orbitalActive,
    }"
    :style="{ '--card-color': card.color }"
    @click="emit('action', card.id)"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  >
    <span :class="['card-badge', card.badgeClass]">{{ card.badge }}</span>
    <div class="card-preview">
      <svg
        :width="card.fullWidth ? 70 : 50"
        :height="card.fullWidth ? 50 : 40"
        :viewBox="card.svgViewBox"
        v-html="card.svgContent"
      />
    </div>
    <div class="card-name">{{ card.name }}</div>
    <div class="card-cost">{{ card.cost }} 💰</div>
    <div class="card-stats">
      <div v-for="stat in card.stats" :key="stat.label" class="card-stat">
        {{ stat.label }}<span>{{ stat.value }}</span>
      </div>
    </div>
    <div v-if="hasLimit" class="limit-bar">
      <div
        class="limit-fill"
        :style="{ background: card.color, width: buildingLimitPercent(card.id) + '%' }"
      />
    </div>
  </div>
</template>

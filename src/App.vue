<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import BottomPanel from './components/BottomPanel.vue'
import {
  money, incomePerSecond, waveNum,
  notifMessage, notifVisible,
  endScreenVisible, endTitle, endWon,
  hpPercent, enemyHpPercent, initGame, cleanupGame, resetGame,
} from './composables/useGame'

const canvasRef = ref<HTMLCanvasElement | null>(null)
const bottomPanelRef = ref<HTMLElement | null>(null)

onMounted(() => {
  if (canvasRef.value && bottomPanelRef.value) {
    const panel = bottomPanelRef.value.querySelector('.bottom-panel') as HTMLElement | null
    const panelHeight = panel?.offsetHeight ?? 0
    initGame(canvasRef.value, panelHeight)
  }
})

onUnmounted(() => {
  cleanupGame()
})

function handleReplay() {
  resetGame()
}
</script>

<template>
  <!-- HUD -->
  <div class="hud">
    <div class="hud-left">
      <div class="hud-title">AEROSTRAT</div>
      <div class="hud-stat">
        <span class="label">CRÉDITS</span>
        <span class="value val-money">{{ money }}</span>
        <span class="val-income">(+{{ incomePerSecond }}/s)</span>
      </div>
    </div>
    <div class="hud-center">
      <span class="value val-hp">{{ hpPercent() }}%</span>
      <span class="hp-divider">/</span>
      <span class="value val-enemy-hp">{{ enemyHpPercent() }}%</span>
    </div>
    <div class="hud-right">
      <div class="hud-wave">VAGUE {{ waveNum }}</div>
    </div>
  </div>

  <canvas ref="canvasRef" id="gameCanvas" />

  <!-- Bottom Panel -->
  <div ref="bottomPanelRef">
    <BottomPanel />
  </div>

  <!-- Tooltip -->
  <div class="tooltip" id="tooltip">
    <div class="tooltip-title" id="tt-title" />
    <div id="tt-desc" />
  </div>

  <!-- Notification -->
  <div class="notif" :class="{ show: notifVisible }">{{ notifMessage }}</div>

  <!-- End Screen -->
  <div id="end-screen" :class="{ show: endScreenVisible }">
    <div
      class="end-title"
      :style="{ color: endWon ? 'var(--teal)' : 'var(--red)' }"
    >
      {{ endTitle }}
    </div>
    <button class="end-btn" @click="handleReplay">
      REJOUER
    </button>
  </div>
</template>

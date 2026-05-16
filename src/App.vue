<script setup lang="ts">
import { ref, watch, nextTick, onUnmounted } from 'vue'
import BottomPanel from './components/BottomPanel.vue'
import MainMenu from './components/MainMenu.vue'
import Settings from './components/Settings.vue'
import Campaign from './components/Campaign.vue'
import TechTree from './components/TechTree.vue'
import MiniMenu from './components/MiniMenu.vue'
import {
  money, incomePerSecond, waveNum,
  notifMessage, notifVisible,
  endScreenVisible, endTitle, endWon,
  hpPercent, enemyHpPercent, initGame, cleanupGame, resetGame,
  lastReward,
} from './composables/useGame'
import { currentScreen, goTo, playSfx, activeMission } from './composables/useMeta'

const canvasRef = ref<HTMLCanvasElement | null>(null)
const bottomPanelRef = ref<HTMLElement | null>(null)

// (Re)start the game whenever we enter the 'game' screen.
watch(() => currentScreen.id, async (id, prev) => {
  if (id === 'game') {
    await nextTick()
    if (canvasRef.value && bottomPanelRef.value) {
      const panel = bottomPanelRef.value.querySelector('.bottom-panel') as HTMLElement | null
      const panelHeight = panel?.offsetHeight ?? 0
      initGame(canvasRef.value, panelHeight)
    }
  } else if (prev === 'game') {
    cleanupGame()
  }
}, { immediate: false })

onUnmounted(() => {
  cleanupGame()
})

function handleReplay() {
  playSfx('click')
  resetGame()
}

function handleQuitToMenu() {
  cleanupGame()
  activeMission.mission = null
  goTo('menu')
}
</script>

<template>
  <!-- ── Main Menu ── -->
  <MainMenu v-if="currentScreen.id === 'menu'" />
  <Settings v-else-if="currentScreen.id === 'settings'" />
  <Campaign v-else-if="currentScreen.id === 'campaign'" />
  <TechTree v-else-if="currentScreen.id === 'tree'" />

  <!-- ── Game Screen ── -->
  <template v-else-if="currentScreen.id === 'game'">
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

    <!-- Minimisable in-game menu -->
    <MiniMenu />

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
      <div v-if="endWon && lastReward > 0" class="end-reward">+{{ lastReward }} XP</div>
      <div class="end-actions">
        <button class="end-btn" @click="handleReplay">REJOUER</button>
        <button class="end-btn ghost" @click="handleQuitToMenu">MENU</button>
      </div>
    </div>
  </template>
</template>

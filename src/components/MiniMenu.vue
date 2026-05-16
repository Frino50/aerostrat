<script setup lang="ts">
import { miniMenuCollapsed, goTo, playSfx, activeMission, meta } from '../composables/useMeta'

function toggle() {
  miniMenuCollapsed.value = !miniMenuCollapsed.value
  playSfx('click')
}

function leave() {
  activeMission.mission = null
  playSfx('click')
  goTo('menu')
}
</script>

<template>
  <div class="mini-menu" :class="{ collapsed: miniMenuCollapsed.value }">
    <button class="mini-toggle" @click="toggle" :title="miniMenuCollapsed.value ? 'Étendre' : 'Réduire'">
      {{ miniMenuCollapsed.value ? '☰' : '×' }}
    </button>
    <div v-if="!miniMenuCollapsed.value" class="mini-body">
      <div class="mini-title">
        <span v-if="activeMission.mission">M{{ String(activeMission.mission.id).padStart(2,'0') }} · {{ activeMission.mission.name }}</span>
        <span v-else>ESCARMOUCHE</span>
      </div>
      <div class="mini-stats">
        <span>XP : <b>{{ meta.xp }}</b></span>
        <span>·</span>
        <span>{{ meta.settings.difficulty.toUpperCase() }}</span>
      </div>
      <button class="mini-btn" @click="leave">QUITTER</button>
    </div>
  </div>
</template>

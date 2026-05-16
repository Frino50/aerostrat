<script setup lang="ts">
import { onMounted } from 'vue'
import {
  goTo, meta, playSfx, startMusic, activeMission, CAMPAIGN,
} from '../composables/useMeta'

onMounted(() => { startMusic() })

function play() {
  // Quick-play: jump to the next campaign mission, or start skirmish if all done
  const nextId = meta.campaignProgress + 1
  const mission = CAMPAIGN.find(m => m.id === nextId) || null
  activeMission.mission = mission
  playSfx('click')
  goTo('game')
}

function startSkirmish() {
  activeMission.mission = null
  playSfx('click')
  goTo('game')
}
</script>

<template>
  <div class="menu-screen">
    <div class="menu-bg" />
    <div class="menu-content">
      <h1 class="menu-title">AEROSTRAT</h1>
      <div class="menu-subtitle">COMMAND &amp; CONQUER THE SKY</div>

      <div class="menu-buttons">
        <button class="menu-btn primary" @mouseenter="playSfx('hover')" @click="play">
          <span class="menu-btn-icon">▶</span>
          <span class="menu-btn-label">JOUER</span>
          <span class="menu-btn-sub">
            {{ meta.campaignProgress >= CAMPAIGN.length ? 'Campagne terminée' : `Mission ${meta.campaignProgress + 1}` }}
          </span>
        </button>
        <button class="menu-btn" @mouseenter="playSfx('hover')" @click="goTo('campaign')">
          <span class="menu-btn-icon">🎖</span>
          <span class="menu-btn-label">CAMPAGNE</span>
          <span class="menu-btn-sub">{{ meta.campaignProgress }}/{{ CAMPAIGN.length }}</span>
        </button>
        <button class="menu-btn" @mouseenter="playSfx('hover')" @click="goTo('tree')">
          <span class="menu-btn-icon">🌳</span>
          <span class="menu-btn-label">ARBRE TECH</span>
          <span class="menu-btn-sub">XP: {{ meta.xp }}</span>
        </button>
        <button class="menu-btn" @mouseenter="playSfx('hover')" @click="startSkirmish">
          <span class="menu-btn-icon">⚔</span>
          <span class="menu-btn-label">ESCARMOUCHE</span>
          <span class="menu-btn-sub">Combat libre</span>
        </button>
        <button class="menu-btn" @mouseenter="playSfx('hover')" @click="goTo('settings')">
          <span class="menu-btn-icon">⚙</span>
          <span class="menu-btn-label">PARAMÈTRES</span>
          <span class="menu-btn-sub">Sons, difficulté</span>
        </button>
      </div>

      <div class="menu-footer">
        <span>Difficulté : <b>{{ meta.settings.difficulty.toUpperCase() }}</b></span>
        <span>·</span>
        <span>XP : <b>{{ meta.xp }}</b></span>
        <span>·</span>
        <span>Unités débloquées : <b>{{ meta.unlocked.length }}</b></span>
      </div>
    </div>
  </div>
</template>

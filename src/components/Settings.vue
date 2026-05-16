<script setup lang="ts">
import { meta, goTo, playSfx, resetProgress } from '../composables/useMeta'

function confirmReset() {
  if (confirm('Réinitialiser toute la progression (XP, déblocages, campagne) ?')) {
    resetProgress()
    playSfx('unlock')
  }
}
</script>

<template>
  <div class="menu-screen">
    <div class="menu-content panel-screen">
      <button class="back-btn" @click="goTo('menu')">← RETOUR</button>
      <h1 class="screen-title">PARAMÈTRES</h1>

      <div class="settings-grid">
        <div class="setting-row">
          <label>Volume musique</label>
          <input
            type="range" min="0" max="1" step="0.05"
            v-model.number="meta.settings.musicVolume"
          />
          <span class="setting-val">{{ Math.round(meta.settings.musicVolume * 100) }}%</span>
        </div>

        <div class="setting-row">
          <label>Volume effets</label>
          <input
            type="range" min="0" max="1" step="0.05"
            v-model.number="meta.settings.sfxVolume"
            @change="playSfx('click')"
          />
          <span class="setting-val">{{ Math.round(meta.settings.sfxVolume * 100) }}%</span>
        </div>

        <div class="setting-row">
          <label>Couper le son</label>
          <input type="checkbox" v-model="meta.settings.muted" />
        </div>

        <div class="setting-row">
          <label>Difficulté</label>
          <div class="diff-buttons">
            <button
              v-for="d in (['easy','normal','hard'] as const)" :key="d"
              class="diff-btn"
              :class="{ active: meta.settings.difficulty === d }"
              @click="meta.settings.difficulty = d; playSfx('click')"
            >{{ d.toUpperCase() }}</button>
          </div>
        </div>

        <div class="setting-row">
          <label>Afficher FPS</label>
          <input type="checkbox" v-model="meta.settings.showFps" />
        </div>
      </div>

      <div class="danger-zone">
        <button class="danger-btn" @click="confirmReset">⚠ RÉINITIALISER PROGRESSION</button>
      </div>
    </div>
  </div>
</template>

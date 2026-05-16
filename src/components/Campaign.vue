<script setup lang="ts">
import {
  CAMPAIGN, meta, goTo, playSfx, activeMission,
} from '../composables/useMeta'
import type { CampaignMission } from '../composables/useMeta'

function isLocked(m: CampaignMission) {
  return m.id > meta.campaignProgress + 1
}
function isDone(m: CampaignMission) {
  return m.id <= meta.campaignProgress
}

function launch(m: CampaignMission) {
  if (isLocked(m)) { playSfx('error'); return }
  activeMission.mission = m
  playSfx('click')
  goTo('game')
}
</script>

<template>
  <div class="menu-screen">
    <div class="menu-content panel-screen wide">
      <button class="back-btn" @click="goTo('menu')">← RETOUR</button>
      <h1 class="screen-title">CAMPAGNE</h1>
      <p class="screen-sub">Avance dans les missions pour gagner de l'XP et débloquer ton arbre technologique. L'ennemi devient plus fort à chaque mission.</p>

      <div class="mission-list">
        <div
          v-for="m in CAMPAIGN" :key="m.id"
          class="mission"
          :class="{ locked: isLocked(m), done: isDone(m) }"
          @click="launch(m)"
          @mouseenter="playSfx('hover')"
        >
          <div class="mission-num">M{{ String(m.id).padStart(2, '0') }}</div>
          <div class="mission-body">
            <div class="mission-name">
              {{ m.name }}
              <span v-if="isDone(m)" class="badge-done">✓ TERMINÉE</span>
              <span v-else-if="isLocked(m)" class="badge-locked">🔒</span>
              <span v-else class="badge-next">▶ DISPONIBLE</span>
            </div>
            <div class="mission-brief">{{ m.brief }}</div>
            <div class="mission-stats">
              <span title="Récompense XP">🏆 +{{ m.xp }} XP</span>
              <span title="Multiplicateur HP ennemi">❤ x{{ m.enemyHpMult.toFixed(2) }}</span>
              <span title="Multiplicateur dégâts ennemi">⚔ x{{ m.enemyDamageMult.toFixed(2) }}</span>
              <span title="Multiplicateur revenu ennemi">💰 x{{ m.enemyIncomeMult.toFixed(2) }}</span>
              <span v-if="m.enemyStartingBonus" title="Bonus de départ ennemi">+{{ m.enemyStartingBonus }} 💰</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

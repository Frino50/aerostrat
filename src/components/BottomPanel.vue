<script setup lang="ts">
import { ref } from 'vue'
import type { TabId } from '../types/game'
import { UNIT_CARDS, BUILDING_CARDS, SPECIAL_CARDS } from '../data/cards'
import GameCard from './GameCard.vue'
import {
  spawnUnit, toggleOrbital, activateShield, activateEMP,
} from '../composables/useGame'

const activeTab = ref<TabId>('units')

const tabs: { id: TabId; icon: string; label: string }[] = [
  { id: 'units', icon: '✈', label: 'UNITÉS' },
  { id: 'buildings', icon: '🏗', label: 'BÂTIMENTS' },
  { id: 'special', icon: '⚡', label: 'SPÉCIAL' },
]

function handleAction(id: string) {
  if (id === 'orbital') toggleOrbital()
  else if (id === 'shield') activateShield()
  else if (id === 'emp') activateEMP()
  else spawnUnit(id)
}
</script>

<template>
  <div class="bottom-panel">
    <div class="tab-bar">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="tab-btn"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        <span class="tab-icon">{{ tab.icon }}</span>{{ tab.label }}
      </button>
    </div>

    <div v-show="activeTab === 'units'" class="card-grid active">
      <GameCard v-for="card in UNIT_CARDS" :key="card.id" :card="card" @action="handleAction" />
    </div>
    <div v-show="activeTab === 'buildings'" class="card-grid active">
      <GameCard v-for="card in BUILDING_CARDS" :key="card.id" :card="card" @action="handleAction" />
    </div>
    <div v-show="activeTab === 'special'" class="card-grid active">
      <GameCard v-for="card in SPECIAL_CARDS" :key="card.id" :card="card" @action="handleAction" />
    </div>
  </div>
</template>

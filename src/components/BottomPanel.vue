<script setup lang="ts">
import { ref, computed } from 'vue'
import type { TabId } from '../types/game'
import { UNIT_CARDS, BUILDING_CARDS, SPECIAL_CARDS } from '../data/cards'
import GameCard from './GameCard.vue'
import {
  spawnUnit, toggleOrbital, activateShield, activateEMP,
} from '../composables/useGame'
import { unlockedCards } from '../composables/useMeta'

const activeTab = ref<TabId>('units')

// Hide cards that are not yet unlocked in the tech tree.
const visibleUnitCards = computed(() => UNIT_CARDS.filter(c => unlockedCards.value.has(c.id)))
const visibleBuildingCards = computed(() => BUILDING_CARDS.filter(c => unlockedCards.value.has(c.id)))
const visibleSpecialCards = computed(() => SPECIAL_CARDS.filter(c => unlockedCards.value.has(c.id)))

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
      <GameCard v-for="card in visibleUnitCards" :key="card.id" :card="card" @action="handleAction" />
      <div v-if="visibleUnitCards.length === 0" class="empty-tab">Aucune unité débloquée — visite l'arbre technologique.</div>
    </div>
    <div v-show="activeTab === 'buildings'" class="card-grid active">
      <GameCard v-for="card in visibleBuildingCards" :key="card.id" :card="card" @action="handleAction" />
      <div v-if="visibleBuildingCards.length === 0" class="empty-tab">Aucun bâtiment débloqué.</div>
    </div>
    <div v-show="activeTab === 'special'" class="card-grid active">
      <GameCard v-for="card in visibleSpecialCards" :key="card.id" :card="card" @action="handleAction" />
      <div v-if="visibleSpecialCards.length === 0" class="empty-tab">Aucun pouvoir débloqué.</div>
    </div>
  </div>
</template>

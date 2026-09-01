<script setup lang="ts">
import Material from './Material.vue'

defineProps<{
  addTab: (targetName: string, component: any, data?: any, targetPath?: string) => void
}>()
</script>

<template>
  <Material :addTab="addTab" materialScope="purchased" />
</template>

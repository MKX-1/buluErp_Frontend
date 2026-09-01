<script setup lang="ts">
import { computed, ref } from 'vue'
import BordShow from '@/components/board/SecBoard.vue'
import MaterialForm from '../component/materialForm.vue';
import MaterialList from '../component/materialList.vue';
type MaterialScope = 'all' | 'internal' | 'purchased'

const props = withDefaults(defineProps<{
  addTab: (targetName: string, component: any, data?: any, targetPath?: string) => void
  materialScope?: MaterialScope
}>(), {
  materialScope: 'all',
})

const fixedPurchased = computed(() => {
  if (props.materialScope === 'internal') return false
  if (props.materialScope === 'purchased') return true
  return null
})

const pageTitle = computed(() => {
  if (props.materialScope === 'internal') return '内部物料查询列表'
  if (props.materialScope === 'purchased') return '外购物料查询列表'
  return '物料查询列表'
})

const pagePath = computed(() => {
  if (props.materialScope === 'internal') return '物料资料表/内部物料'
  if (props.materialScope === 'purchased') return '物料资料表/外购物料'
  return '物料管理/物料'
})

const buildSearchParams = (params: Record<string, any>) => ({
  mouldNumber: params.mouldNumber || null,
  mouldManufacturer: params.mouldManufacturer || null,
  purchased: fixedPurchased.value ?? (params.purchased ?? null),
})

const searchParams = ref<Record<string, any>>(buildSearchParams({}))

const handleSearch = (params: Record<string, any>) => {
  searchParams.value = buildSearchParams(params)
}

const handleCreated = () => {
  handleSearch(searchParams.value)
}
</script>
<template>
  <div>
    <BordShow :content="pageTitle" :path="pagePath" />
    <div class="greyBack">
      <MaterialForm :materialScope="props.materialScope" @search="handleSearch" @created="handleCreated" />
      <MaterialList :queryParams="searchParams" :addTab="props.addTab" :materialScope="props.materialScope" />
    </div>
  </div>
</template>

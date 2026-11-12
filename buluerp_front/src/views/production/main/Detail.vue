<script setup lang="ts">
import { ref, onMounted } from 'vue'
import BordShow from '@/components/board/SecBoard.vue'
import basicInfomation from '../component/basicInfomation.vue'
import StyleList from '../component/styleList.vue'
import { getProductDetail } from '@/apis/products.js'
import { getMaterialList } from '@/apis/materials.js'

const props = defineProps<{ data: any }>()

const detail = ref(props.data)
const basicInfoRef = ref()

const refreshBasicInfo = async () => {
  if (!detail.value?.id) return
  const res = await getProductDetail(detail.value.id)
  detail.value = res.data
}
onMounted(refreshBasicInfo)

</script>

<template>
  <div class="col">
    <BordShow content="产品详情页" path="产品管理/详情" />
    <basicInfomation ref="basicInfoRef" v-if="detail" :detail="detail" :materialData="[]" @saved="refreshBasicInfo"  />
    <StyleList v-if="detail" :detail="detail"  @refresh="refreshBasicInfo"/>
  </div>
</template>

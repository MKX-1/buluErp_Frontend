<script setup lang="ts">
const props = withDefaults(defineProps<{ modelValue: string[]; lockPrimary?: boolean; entityLabel?: string }>(), { entityLabel: '产品' })
const emit = defineEmits<{ 'update:modelValue': [value: string[]] }>()

function update(index: number, value: string) {
  emit('update:modelValue', props.modelValue.map((code, i) => i === index ? value : code))
}
</script>

<template>
  <div class="inner-code-editor">
    <div v-for="(code, index) in modelValue" :key="index" class="code-row">
      <el-input :model-value="code" :disabled="lockPrimary && index === 0" maxlength="50"
        :aria-label="`内部编号${index + 1}`" placeholder="请输入内部编号"
        @update:model-value="update(index, $event)" />
      <el-tag v-if="index === 0" type="info">默认</el-tag>
      <el-button v-else link type="danger" :aria-label="`删除内部编号${index + 1}`"
        @click="emit('update:modelValue', modelValue.filter((_, i) => i !== index))">删除</el-button>
    </div>
    <el-button type="primary" plain @click="emit('update:modelValue', [...modelValue, ''])">＋ 添加编号</el-button>
    <div v-if="lockPrimary" class="code-tip">原编号保持不变，其他编号也可用于查找此{{ entityLabel }}。</div>
  </div>
</template>

<style scoped>
.inner-code-editor { width: 100%; }
.code-row { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.code-row .el-input { flex: 1; min-width: 0; }
.code-tip { font-size: 12px; color: #909399; line-height: 1.5; margin-top: 8px; }
</style>

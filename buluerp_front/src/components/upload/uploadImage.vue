<template>
  <el-upload
    ref="upload"
    :on-change="handleFileChange"
    :on-remove="handleFileRemove"
    :on-exceed="handleFileExceed"
    style="margin: 20px; width: 200px; height: 200px; text-align: center"
    :auto-upload="false"
    :limit="1"
    accept="image/*"
  >
    <img v-if="imgShowUrl" :src="imgShowUrl" class="cover" style="width: 150px; height: 150px" />
    <div v-else class="centerText">上传样例图</div>
  </el-upload>
</template>
<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { ElMessage, genFileId } from 'element-plus'
import type { UploadProps } from 'element-plus'
import { getFullImageUrl } from '@/utils/image/getUrl'

const props = defineProps(['setFile', 'ImgUrl', 'setImgUrl', 'onRemove'])
const imgShowUrl = ref('')
const upload = ref()
let objectUrl = ''

const revokeObjectUrl = () => {
  if (objectUrl) {
    URL.revokeObjectURL(objectUrl)
    objectUrl = ''
  }
}
watch(
  () => props.ImgUrl,
  (newImgUrl) => {
    if (newImgUrl != 'created') {
      revokeObjectUrl()
      imgShowUrl.value = newImgUrl ? getFullImageUrl(newImgUrl) : ''
    }

    if (!newImgUrl && upload.value) {
      upload.value.clearFiles()
    }
  },
)
imgShowUrl.value = props.ImgUrl ? getFullImageUrl(props.ImgUrl) : ''
const handleFileChange: UploadProps['onChange'] = (file) => {
  if (!file.raw?.type?.startsWith('image/')) {
    ElMessage.error('只能上传图片格式（如 JPG、PNG）')
    upload.value?.clearFiles()
    props.setFile(null)
    return
  }
  revokeObjectUrl()
  props.setFile(file.raw)
  objectUrl = URL.createObjectURL(file.raw)
  imgShowUrl.value = objectUrl
  props.setImgUrl('created')
}
const handleFileRemove = () => {
  revokeObjectUrl()
  imgShowUrl.value = ''
  props.setFile(null)
  props.setImgUrl('')
  props.onRemove?.()
}
const handleFileExceed: UploadProps['onExceed'] = (files) => {
  upload.value.clearFiles()
  const file = files[0]
  file.uid = genFileId()
  upload.value.handleStart(file)
}

onBeforeUnmount(revokeObjectUrl)
</script>

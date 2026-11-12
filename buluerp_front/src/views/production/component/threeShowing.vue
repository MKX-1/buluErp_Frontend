<template>
    <div id="webgl" ref="webgl" class="three-container">
      <div v-if="status !== 'ready'" class="model-status" role="status">{{ status === 'loading' ? '模型加载中…' : status === 'error' ? '3D模型加载失败，请刷新重试' : '暂无模型' }}</div>
    </div>
</template>
<script setup>
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { getModelUrl } from '@/utils/modelUrl'

const webgl = ref(null)
const status = ref('loading')
let requestId = 0
let disposed = false
let cleanupModel = () => {}
let animationId = null
let renderer = null
let camera = null
let resizeObserver = null

const props = defineProps({
  modelUrl: {
    type: String,
    default: ''
  }
})
onMounted(() => {
  if (!webgl.value) return
  
  // 动态获取容器的宽高，而不是写死 800x600
  const width = Math.max(webgl.value.clientWidth, 1)
  const height = Math.max(webgl.value.clientHeight, 1)
  
  //场景
  const scene = new THREE.Scene()
  scene.background = null 
  
  //相机
  camera = new THREE.PerspectiveCamera(30, width/height, 1, 3000)
  camera.position.set(100, 100, 100)
  camera.lookAt(0, 10, 1)
  
  //渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(width, height)
  renderer.setPixelRatio(window.devicePixelRatio)

  webgl.value.appendChild(renderer.domElement)
  // 1. 环境光：提供基础亮度，保证暗部不至于全黑
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4) 
  scene.add(ambientLight)
  
  // 2. 主光源 (平行光)：模拟太阳光，产生强烈的明暗对比
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(50, 100, 50) // 从斜上方照射
  scene.add(directionalLight)

  // 3. 辅助光源 (点光源)：用来打亮侧面，增加立体感
  const pointLight = new THREE.PointLight(0xffffff, 0.5)
  pointLight.position.set(-50, 50, -50)
  scene.add(pointLight)
  // 添加控制器
  const controls = new OrbitControls(camera, renderer.domElement)
  controls.addEventListener('change', () => {
    renderer.render(scene, camera)
  })
  controls.enableDamping = true

  let loadedMesh = null
  const disposeModel = model => model?.traverse(object => {
    object.geometry?.dispose()
    const materials = Array.isArray(object.material) ? object.material : [object.material]
    materials.filter(Boolean).forEach(material => {
      Object.values(material).forEach(value => { if (value?.isTexture) value.dispose() })
      material.dispose()
    })
  })
  cleanupModel = () => { controls.dispose(); disposeModel(loadedMesh) }

  // 抽取加载模型的逻辑到一个单独的函数中
  const loadModel = () => {
    const currentRequest = ++requestId
    // 如果已经加载了模型，先从场景中移除并清理内存
    if (loadedMesh) {
      scene.remove(loadedMesh)
      disposeModel(loadedMesh)
      loadedMesh = null
    }

    status.value = props.modelUrl ? 'loading' : 'empty'
    if (!props.modelUrl) return

    const loader = new GLTFLoader()
    const modelPath = getModelUrl(props.modelUrl)
    
    loader.load(modelPath, (gltf) => {
      const model = gltf.scene
      if (disposed || currentRequest !== requestId) { disposeModel(model); return }
      const bounds = new THREE.Box3().setFromObject(model)
      const center = bounds.getCenter(new THREE.Vector3())
      model.position.sub(center)
      const radius = Math.max(bounds.getSize(new THREE.Vector3()).length() / 2, 0.001)
      const halfFov = THREE.MathUtils.degToRad(camera.fov / 2)
      const angle = Math.min(halfFov, Math.atan(Math.tan(halfFov) * camera.aspect))
      const distance = radius / Math.sin(angle) * 1.15
      camera.position.copy(new THREE.Vector3(1, 0.7, 1).normalize().multiplyScalar(distance))
      camera.near = Math.max(radius / 1000, 0.00001)
      camera.far = distance + radius * 10
      camera.updateProjectionMatrix()
      controls.target.set(0, 0, 0)
      controls.update()
      scene.add(model)
      loadedMesh = model
      status.value = 'ready'
    }, undefined, (error) => {
      if (disposed || currentRequest !== requestId) return
      status.value = 'error'
      console.warn('3D模型加载失败', error)
    })
  }
  loadModel()
  // 监听属性变化，如果 URL 改变了重新加载
  watch(() => props.modelUrl, (newUrl) => {
    loadModel()
  })

  const animate = () => {
    animationId = requestAnimationFrame(animate)
    controls.update()
    if (loadedMesh) {
      loadedMesh.rotateY(0.01)
    }
    renderer.render(scene, camera)
  }
  animate()

  // 使用 ResizeObserver 监听容器尺寸变化（解决弹窗中由于动画导致初始尺寸为0的问题）
  resizeObserver = new ResizeObserver(() => {
    onWindowResize()
  })
  resizeObserver.observe(webgl.value)
})

const onWindowResize = () => {
  if (!webgl.value || !camera || !renderer) return
  const width = webgl.value.clientWidth
  const height = webgl.value.clientHeight
  // 如果容器还没有渲染出来（宽或高为0），则跳过
  if (width === 0 || height === 0) return

  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

onBeforeUnmount(() => {
  disposed = true
  ++requestId
  cleanupModel()
  if (animationId) cancelAnimationFrame(animationId)
  if (renderer) renderer.dispose()
  if (resizeObserver && webgl.value) resizeObserver.disconnect()
})
</script>
<style scoped>
.three-container {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 8px;
  overflow: hidden;
}
.model-status { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; text-align: center; font-size: 12px; color: #909399; z-index: 1; }
</style>

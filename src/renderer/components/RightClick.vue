<template>
  <div v-if="visible" ref="menuRef" class="context-menu" :style="styleObj" @contextmenu.prevent>
    <ul class="cm-list">
      <li v-for="item in items" :key="item.key" class="cm-item" @click="onClick(item)">
        <span class="cm-icon" v-if="item.icon" v-html="item.icon"></span>
        <span class="cm-label">{{ item.label }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onBeforeUnmount } from 'vue'
// import { useEventListener } from '@vueuse/core' // 可选，如果没有可以用原生 addEventListener

const props = defineProps({
  items: { type: Array, default: () => [] } // [{ key: 'open', label: '打开', icon: '📂' }, ...]
})

const emit = defineEmits(['select', 'close'])

const visible = ref(false)
const x = ref(0)
const y = ref(0)
const payload = ref(null) // 存放调用者传来的目标对象
const menuRef = ref(null)

const styleObj = computed(() => ({
  position: 'fixed',
  top: `${y.value}px`,
  left: `${x.value}px`,
  zIndex: 9999
}))

function openAt(clientX, clientY, data = null) {
  payload.value = data
  visible.value = true
  x.value = clientX
  y.value = clientY
  // 等 DOM 渲染后调整边界避免超出视口
  nextTick(adjustBounds)
  // 点击任意处或 Esc 关闭
  document.addEventListener('click', onDocClick)
  document.addEventListener('keyup', onKeyUp)
}

function close() {
  visible.value = false
  payload.value = null
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keyup', onKeyUp)
  emit('close')
}

function onDocClick(e) {
  // 如果点击在菜单内部则忽略（菜单上的 click 会先执行）
  if (menuRef.value && menuRef.value.contains(e.target)) return
  close()
}

function onKeyUp(e) {
  if (e.key === 'Escape') close()
}

function onClick(item) {
  emit('select', { action: item.key, item, target: payload.value })
  close()
}

function adjustBounds() {
  const el = menuRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const vw = window.innerWidth
  const vh = window.innerHeight
  let nx = x.value
  let ny = y.value
  if (rect.right > vw) nx = Math.max(4, vw - rect.width - 8)
  if (rect.bottom > vh) ny = Math.max(4, vh - rect.height - 8)
  x.value = nx
  y.value = ny
}

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keyup', onKeyUp)
})

// 对外暴露 openAt/close 方法，父组件通过 ref 调用
defineExpose({ openAt, close })
</script>

<style scoped>
.context-menu {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 6px 22px rgba(0,0,0,0.18);
  min-width: 160px;
  overflow: hidden;
  padding: 6px 0;
  font-size: 14px;
}
.cm-list { list-style: none; margin: 0; padding: 0; }
.cm-item {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  transition: background .12s;
}
.cm-item:hover { background: #f5f6f8; }
.cm-icon { width: 20px; text-align: center; }
.cm-label { flex: 1; }
</style>

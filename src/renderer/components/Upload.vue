<template>
  <div @paste="handlePaste">
    <button @click="chooseFile">选择文件上传</button>
    <div style="border: 1px dashed #aaa; padding: 16px; margin: 16px 0; text-align: center; color: #666;">
      按 <b>Ctrl + V</b> 粘贴图片上传
    </div>
    <ul>
      <li v-for="file in selectedFiles" :key="file.name || file">
        <div v-if="isFileObject(file) && isImageFile(file)">
          <img :src="getImageUrl(file)" style="max-width: 200px; max-height: 200px; display: block; margin-bottom: 8px;" />
        </div>
        {{ file.name || file }}
        <button @click="upload(file)">上传</button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const selectedFiles = ref<(string | File)[]>([])

function isFileObject(file: string | File): file is File {
  return typeof file !== 'string'
}

function isImageFile(file: File) {
  return file.type.startsWith('image/')
}

function getImageUrl(file: File) {
  return URL.createObjectURL(file)
}

async function chooseFile() {
  const files = await window.electronAPI.selectFile()
  selectedFiles.value = files
}

async function upload(filePath: string | File) {
  let res
  console.log(filePath);

  if (typeof filePath === 'string') {
    res = await window.electronAPI.uploadFile(filePath)
  } else {
    const arrayBuffer = await filePath.arrayBuffer();
    console.log('文件大小:', filePath.size, '字节')
    if(filePath.size > 500 * 1024 * 1024) {
      return ElMessage.error('文件过大, 请上传小于500MB的文件')
    }
    res = await window.electronAPI.uploadClipboardFile(arrayBuffer, filePath.name)
    }
    if (res.success) {
      ElMessage.success(`上传成功, 保存到: ${res.savedTo}`)
      selectedFiles.value = selectedFiles.value.filter(f => (isFileObject(f) ? f.name !== filePath.name : f !== filePath));
    } else {
      ElMessage.error(`上传失败: ${res.message || '未知错误'}`)
    }
}

function handlePaste(e: ClipboardEvent) {
  const items = e.clipboardData?.items
  if (!items) return
  for (const item of items) {
    if (item.kind === 'file') {
      const file = item.getAsFile()
      if (file) {
        selectedFiles.value.push(file)
      }
    }
  }
}
</script>

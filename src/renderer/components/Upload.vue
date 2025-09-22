<template>
  <div @paste="handlePaste">
    <div style="border: 1px dashed #aaa; padding: 16px; margin: 16px 0; text-align: center; color: #666;">
      按 <b>Ctrl + V</b> 粘贴图片上传
    </div>
    <el-button @click="chooseFile">选择文件上传</el-button>

    <el-table :data="selectedFiles" border style="width: 100%; margin-top: 12px;" size="small">
      <el-table-column label="文件" min-width="400">
        <template #default="scope">
          <div class="file-cell">
            <!-- 图片缩略图 -->
            <div v-if="isFileObject(scope.row.file) && isImageFile(scope.row.file)" class="preview-box">
              <img :src="getImageUrl(scope.row.file)" class="preview-img" />
            </div>

            <!-- 文件名（双击可编辑） -->
            <div class="file-name">
              <span v-if="!scope.row.editing" @dblclick="startEdit(scope.row)">
                {{ getFileName(scope.row.file) }}
              </span>
              <el-input v-else v-model="scope.row.tempName" size="small" @blur="finishEdit(scope.row)"
                @keyup.enter="finishEdit(scope.row)" style="width: 200px" />
            </div>

            <!-- 操作按钮 -->
            <div class="file-actions">
              <el-button size="small" type="primary" @click="upload(scope.row)">
                上传
              </el-button>
              <el-button size="small" type="danger" @click="removeFile(scope.row)">
                移除
              </el-button>
            </div>
          </div>
          <!-- 上传进度条，单独占一行 -->
          <div style="margin-top: 8px;">
            <el-progress v-if="scope.row.progress !== undefined" :percentage="scope.row.progress"
              style="width: 100%;" />
          </div>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { ElMessage } from "element-plus"

interface FileTask {
  file: string | File
  taskId: string
  progress?: number
  editing?: boolean   // 是否编辑状态
  tempName?: string   // 临时输入的名字
}

const selectedFiles = ref<FileTask[]>([])

function genTaskId() {
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function isFileObject(file: string | File): file is File {
  return typeof file !== "string"
}
function isImageFile(file: File) {
  return file.type.startsWith("image/")
}
function getImageUrl(file: File) {
  return URL.createObjectURL(file)
}
function getFileName(file: string | File) {
  return isFileObject(file) ? file.name : file
}

async function chooseFile() {
  const files = await window.electronAPI.selectFile()
  selectedFiles.value = files.map((f: string | File) => ({
    file: f,
    taskId: genTaskId(),
    editing: false,
    tempName: getFileName(f)
  }))
}

window.electronAPI.onUploadProgress(({ taskId, progress }) => {
  const task = selectedFiles.value.find(t => t.taskId === taskId)
  if (task) {
    task.progress = Number(progress.percent.toFixed(2))
  }
})

async function upload(task: FileTask) {
  if (task.progress !== undefined && task.progress > 0 && task.progress < 100) {
    ElMessage.warning("正在上传中，请勿重复点击")
    return
  }
  task.progress = 1
  let res
  const filePath = task.file

  if (typeof filePath === "string") {
    res = await window.electronAPI.uploadFile(filePath, task.taskId)
  } else {
    const arrayBuffer = await filePath.arrayBuffer()
    if (filePath.size > 500 * 1024 * 1024) {
      return ElMessage.error("文件过大, 请点击上传以上传大于500MB的文件")
    }
    res = await window.electronAPI.uploadClipboardFile(
      arrayBuffer,
      filePath.name,
      task.taskId
    )
  }
  console.log("res", res)

  if (res.success) {
    ElMessage.success(`上传成功, 保存到: ${res.remote_dest}`)
    selectedFiles.value = selectedFiles.value.filter(
      f => f.taskId !== task.taskId
    )
  } else {
    ElMessage.error(`上传失败: ${res.message || "未知错误"}`)
  }
}

function removeFile(task: FileTask) {
  selectedFiles.value = selectedFiles.value.filter(f => f.taskId !== task.taskId)
}

function handlePaste(e: ClipboardEvent) {
  const items = e.clipboardData?.items
  if (!items) return
  for (const item of items) {
    if (item.kind === "file") {
      let file = item.getAsFile()
      if (file) {
        let fileName = file.name
        if (fileName === "image.png") {
          fileName = `screenshot-${Date.now()}.png`
          file = new File([file], fileName, { type: file.type })
        }
        selectedFiles.value.push({
          file,
          taskId: genTaskId(),
          editing: false,
          tempName: file.name
        })
      }
    }
  }
}

/** 开始编辑 */
function startEdit(task: FileTask) {
  if (isFileObject(task.file)) {
    task.editing = true
    task.tempName = getFileName(task.file)
  }

}

/** 完成编辑 */
function finishEdit(task: FileTask) {
  if (!task.tempName) {
    task.editing = false
    return
  }
  if (isFileObject(task.file)) {
    // 重新构造一个 File，修改 name
    task.file = new File([task.file], task.tempName, { type: task.file.type })
  } else {
    task.file = task.tempName
  }
  task.editing = false
}
</script>
<style
  scoped>
  .file-cell {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .preview-img {
    max-width: 100px;
    max-height: 100px;
    object-fit: contain;
    border-radius: 4px;
  }

  .file-name {
    flex: 1;
  }

  .file-actions {
    display: flex;
    gap: 8px;
  }
</style>

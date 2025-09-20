<template>
    <el-card class="file-browser" shadow="hover">
        <div class="path-bar">
            <el-breadcrumb separator="/">
                <el-breadcrumb-item
                    v-for="(segment, idx) in ['Root', ...pathSegments]"
                    :key="idx"
                >
                    <a href="#" @click.prevent="goTo(idx - 1)">
                        {{ segment }}
                    </a>
                </el-breadcrumb-item>
            </el-breadcrumb>
            <el-upload
                :action="uploadUrl"
                :data="{ path: currentPath }"
                :show-file-list="false"
                @success="onUploadSuccess"
                style="display:inline-block;margin-left:20px;"
            >
                <el-button size="small" type="primary">上传文件</el-button>
            </el-upload>
        </div>
        <el-table
            :data="items"
            style="width: 100%"
            @row-click="open"

            height="100vh"
            size="small"
            border
        >
            <el-table-column
                prop="name"
                label="Name"
                min-width="180"
            >
                <template #default="scope">
                    <span v-if="scope.row.isDirectory">📁</span>
                    <span v-else>📄</span>
                    <span
                        v-if="!scope.row.isDirectory"
                        class="download-link"
                        @click.stop="download(scope.row)"
                        style="color:#409EFF;cursor:pointer;margin-right:8px;"
                    >下载</span>
                    {{ scope.row.name }}
                </template>
            </el-table-column>
            <el-table-column
                prop="isDirectory"
                label="Type"
                width="80"
            >
                <template #default="scope">
                    <el-tag size="small" :type="scope.row.isDirectory ? 'success' : 'info'">
                        {{ scope.row.isDirectory ? 'Folder' : 'File' }}
                    </el-tag>
                </template>
            </el-table-column>
        </el-table>
    </el-card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElCard, ElBreadcrumb, ElBreadcrumbItem, ElTable, ElTableColumn, ElTag, ElUpload, ElButton } from 'element-plus'
import 'element-plus/dist/index.css'
import axios from 'axios'

// 假设后端接口
const uploadUrl = '/api/upload'
const downloadUrl = '/api/download'

// 用于真实后端接口
async function fetchItems(path) {
    return window.electronAPI.fetchItems(path);
}

// 切换为真实接口
async function loadItems() {
    items.value = await fetchItems(currentPath.value)
}
const mockFS = {
    '': [
        { name: 'Documents', isDirectory: true },
        { name: 'Pictures', isDirectory: true },
        { name: 'readme.txt', isDirectory: false }
    ],
    'Documents': [
        { name: 'Resume.docx', isDirectory: false },
        { name: 'Notes', isDirectory: true }
    ],
    'Documents/Notes': [
        { name: 'todo.txt', isDirectory: false }
    ],
    'Pictures': [
        { name: 'photo.jpg', isDirectory: false }
    ]
}

const currentPath = ref('')
const items = ref([])

const pathSegments = computed(() =>
    currentPath.value ? currentPath.value.split('/').filter(Boolean) : []
)

// function loadItems() {
//     items.value = mockFS[currentPath.value] || []
// }

function open(row) {
    if (row.isDirectory) {
        currentPath.value = currentPath.value
            ? `${currentPath.value}/${row.name}`
            : row.name
        loadItems()
    }
}

function goTo(idx) {
    if (idx < 0) {
        currentPath.value = ''
    } else {
        currentPath.value = pathSegments.value.slice(0, idx + 1).join('/')
    }
    loadItems()
}

function onUploadSuccess() {
    // 上传成功后刷新
    loadItems()
}

function download(row) {
    // 实际应调用后端接口
    // 这里只是模拟
    const filePath = currentPath.value ? `${currentPath.value}/${row.name}` : row.name
    window.open(`${downloadUrl}?path=${encodeURIComponent(filePath)}`)
}

onMounted(loadItems)
</script>

<style scoped>
.file-browser {
    width: 100vh;
    height: 90vh;
    margin: 20px auto;
    background: #fff;
}
.path-bar {
    margin-bottom: 12px;
}
.download-link:hover {
    text-decoration: underline;
}
</style>
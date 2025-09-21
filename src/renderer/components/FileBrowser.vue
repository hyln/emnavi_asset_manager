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
            <!-- <el-upload
                :action="uploadUrl"
                :data="{ path: currentPath }"
                :show-file-list="false"
                @success="onUploadSuccess"
                style="display:inline-block;margin-left:20px;"
            >
            <el-button size="small" type="primary">上传文件</el-button>
            </el-upload> -->
            <el-button size="small" type="success" @click="createFolder" style="margin-left:10px;">
                <i class="el-icon-folder-add" style="margin-right:4px;"></i>新建文件夹
            </el-button>
            <el-button size="small" type="danger" @click="onDelete" style="margin-left:10px;">
                <i class="el-icon-delete" style="margin-right:4px;"></i>删除
            </el-button>

        </div>
        <el-table
            :data="items"
            style="width: 100%"
            @row-dblclick="open"
            highlight-current-row
            @current-change="onCurrentChange"
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
                    <div @contextmenu.prevent="openMenu($event, scope.row)">
                        <span v-if="scope.row.isDirectory">📁</span>
                        <span v-else>📄</span>
                        <span
                            v-if="!scope.row.isDirectory"
                            class="download-link"
                            @click.stop="copyDownloadLink(scope.row)"
                            style="color:#409EFF;cursor:pointer;margin-right:8px;"
                        >复制下载链接</span>
                        {{ scope.row.name }}
                    </div>
                    <!-- {{ scope.row.name }} -->
                </template>
            </el-table-column>
            <el-table-column
                prop="mtime"
                label="修改时间"
                min-width="160"
            >
                <template #default="scope">
                    <span>{{ scope.row.mtime ? new Date(scope.row.mtime* 1000).toLocaleString() : '-' }}</span>
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
        <!-- <RightClick ref="ctx" :items="menuItems" @select="onMenuSelect"/> -->

    </el-card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElCard,ElMessageBox,ElMessage, ElBreadcrumb, ElBreadcrumbItem, ElTable, ElTableColumn, ElTag, ElUpload, ElButton } from 'element-plus'
import 'element-plus/dist/index.css'
import axios from 'axios'
import RightClick from '../components/RightClick.vue';

// 假设后端接口
const uploadUrl = '/api/upload'
const downloadUrl = '/api/download'

const choose_file_path = ref(null)
function onCurrentChange(row) {
    console.log('当前选中行:', row);
    if (!row) {
        choose_file_path.value = null
        return
    }
    choose_file_path.value = currentPath.value
        ? `${currentPath.value}/${row.name}`
        : row.name
    console.log('当前选中行:', choose_file_path.value);
}

// 用于真实后端接口
async function fetchItems(path) {
    return window.electronAPI.fetchItems(path);
}

// 切换为真实接口
async function loadItems() {
    items.value = await fetchItems(currentPath.value)
    console.log(items.value);
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
const ctx = ref(null)
// const menuItems = [
//   { key: 'open', label: '📂 打开' },
//   { key: 'download', label: '⬇️ 下载' },
//   { key: 'rename', label: '✏️ 重命名' },
//   { key: 'delete', label: '🗑 删除' }
// ] 
const pathSegments = computed(() =>
    currentPath.value ? currentPath.value.split('/').filter(Boolean) : []
)

// function onMenuSelect({ action, target }) {
//   // target 即为之前传入的 file
//   console.log('menu action', action, 'target', target)
//   if (action === 'open') {
//     // 打开目录或文件
//   } else if (action === 'download') {
//     // 调用下载
//   } else if (action === 'delete') {
//     // 删除
//   }
// }
// function loadItems() {
//     items.value = mockFS[currentPath.value] || []
// }
function openMenu(e, file) {
  // e.clientX/e.clientY 是相对于视口的坐标
  ctx.value.openAt(e.clientX, e.clientY, file)
}
function open(row) {
    console.log(currentPath.value);
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
function createFolder() {
  console.log('Creating folder in', currentPath.value);

  ElMessageBox.prompt(
    '请输入新文件夹名称',
    '新建文件夹',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /^[^\\/:\*\?"<>\|]+$/,
      inputErrorMessage: '文件夹名不能包含特殊字符 \\ / : * ? " < > |',
    }
  )
    .then(({ value }) => {
      console.log('Creating folder', value, 'in', currentPath.value);
      return window.electronAPI.createFolder(currentPath.value, value);
    })
    .then(() => {
      ElMessage.success('文件夹创建成功');
      loadItems();
    })
    .catch((e) => {
      if (e !== 'cancel') {
        ElMessage.error('创建文件夹失败: ' + (e.message || e));
      }
    });
}

function copyDownloadLink(row) {
    const websiteUrl = 'http://file.emnavi.tech' // 替换为你的实际网站地址
    const filePath = currentPath.value ? `${currentPath.value}/${row.name}` : row.name
    const link = `${websiteUrl}/${(filePath)}`
    navigator.clipboard.writeText(link).then(() => {
        ElMessage.success('下载链接已复制到剪贴板')
    }).catch(() => {
        ElMessage.error('复制下载链接失败')
    })
}

function onDelete() {
    const selected = items.value.filter(item => item._selected);
    if (selected.length === 0) {
        ElMessage.warning('请先选择要删除的文件或文件夹');
        return;
    }
    ElMessageBox.confirm(
        `确定要删除选中的 ${selected.length} 个项目吗？此操作不可撤销。`,
        '删除确认',
        {
            confirmButtonText: '删除',
            cancelButtonText: '取消',
            type: 'warning'
        }
    ).then(() => {
        const names = selected.map(item => item.name);
        return window.electronAPI.deleteItems(currentPath.value, names);
    }).then(() => {
        ElMessage.success('删除成功');
        loadItems();
    }).catch((e) => {
        if (e !== 'cancel') {
            ElMessage.error('删除失败: ' + (e.message || e));
        }
    });
}


onMounted(loadItems)
</script>

<style scoped>
.file-browser {
    width: 100%;
    height: 90vh;
    /* margin: 20px auto; */
    background: #fff;
}
.path-bar {
    margin-bottom: 12px;
}
.download-link:hover {
    text-decoration: underline;
}
</style>
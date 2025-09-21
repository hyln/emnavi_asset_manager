<template>
    <div class="main-container">

        
    </div>
    <el-row style="height: 100%;">
        <!-- 左侧区域 -->
        <el-col :span="18" style="background: #f5f7fa;  min-width: 200px; padding: 24px;">
            <!-- 可放置左侧内容 -->
            <!-- <div>左侧内容区域</div> -->
            <FileBrowser />
        </el-col>

        <!-- 右侧区域 -->
        <el-col :span="6" style="padding: 24px;">
            <el-row :gutter="20" style="height: 100%;">
                <el-col :span="24" style="max-width: 900px; margin: 0 auto; height: 100%; display: flex; flex-direction: column;">
                    <!-- 上半部分：拖拽上传 -->
                    <div style="flex: 1;">
                        <Upload />
                    </div>
                    <!-- 下半部分：当前选中文件状态 -->
                    <div style="margin-top: 24px;">
                        <el-card v-if="selectedFile" shadow="never">
                            <div>
                                <strong>文件名：</strong>{{ selectedFile.name }}
                            </div>
                            <div>
                                <strong>大小：</strong>{{ (selectedFile.size / 1024).toFixed(2) }} KB
                            </div>
                            <div>
                                <strong>类型：</strong>{{ selectedFile.type }}
                            </div>
                        </el-card>
                        <el-empty v-else description="未选择文件"></el-empty>
                    </div>
                </el-col>
            </el-row>
        </el-col>
    </el-row>
</template>

<script setup>
import { ref } from 'vue';
import FileBrowser from '../components/FileBrowser.vue';
import Upload from '../components/Upload.vue';  
const selectedFile = ref(null);

function handleChange(file) {
    selectedFile.value = file.raw;
}
</script>

<style scoped>
.upload-demo {
    width: 100%;
    min-height: 180px;
    border: 2px dashed #d9d9d9;
    border-radius: 6px;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>
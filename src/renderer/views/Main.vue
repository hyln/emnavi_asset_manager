<template>
    <div class="main-container">


    </div>
    <el-row style="height: 100%;">
        <!-- 左侧区域 -->
        <el-col :span="16" style="background: #f5f7fa;  min-width: 200px; padding: 24px;">
            <!-- 可放置左侧内容 -->
            <!-- <div>左侧内容区域</div> -->
            <FileBrowser @choose-file-change="onChooseFileChange" />
        </el-col>

        <!-- 右侧区域 -->
        <el-col :span="8" style="padding: 24px;">
            <el-row :gutter="20" style="height: 100%;">
                <el-col :span="24"
                    style="max-width: 100%; margin: 0 auto; height: 100%; display: flex; flex-direction: column;">
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
                            <div v-if="isImage" style="margin-top: 16px;">
                                <img
                                    :src="previewSrc"
                                    alt="图片预览"
                                    style="max-width: 100%; max-height: 400px; border: 1px solid #eee; border-radius: 4px;"
                                />
                            </div>
                        </el-card>
                        <el-empty v-else description="未选择文件"></el-empty>
                    </div>
                </el-col>
            </el-row>
        </el-col>
    </el-row>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import FileBrowser from '../components/FileBrowser.vue';
import Upload from '../components/Upload.vue';
const selectedFile = ref(null);
const previewSrc = ref('');
const isImage = ref(false);


async function onChooseFileChange(meta: string | null) {
    console.log('子组件选中文件改变:', meta)
    // 执行父组件动作
    selectedFile.value = meta;
    if (meta) {
        const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg'];
        const fileName = meta.name || '';
        const lowerName = fileName.toLowerCase();
        isImage.value = imageExtensions.some(ext => lowerName.endsWith(ext));
        if (isImage.value) {
            console.log('是图片文件，获取预览图');
            const pic_asset = await window.electronAPI.getPreviewImg(meta.name);
            console.log('预览图获取结果:', pic_asset);
            if (pic_asset && pic_asset.success && pic_asset.data) {
                previewSrc.value = `data:image/png;base64,${pic_asset.data}`;
            }

        }
    }

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
import axios from 'axios';



// 用于真实后端接口
export async function fetchItems(path: string, auth_id: string) {
    try {
        const res = await axios.get('http://110.42.45.189:16000/api/list-files', {
            params: { path: path || '', auth_id }
        });
        // 转换后端返回结构为 [{ name, isDirectory }]
        return (res.data.files || []).map((f: any) => ({
            name: f.name,
            isDirectory: f.is_dir,
            mtime: f.mtime,
            size: f.size
        }));
    } catch (e) {
        return [];
    }
};

export async function createFolder(path: string, folder_name: string, auth_id: string) {
    try {
        const res = await axios.post('http://110.42.45.189:16000/api/create-folder', {
            path,
            folder_name,
            auth_id
        });
        return res.data;
    } catch (e) {
        return null;
    }
};
// 获取磁盘空间信息
export async function fetchDiskInfo( auth_id: string) {
    try {
        const res = await axios.get('http://110.42.45.189:16000/api/disk-space', {
            params: { auth_id }
        });
        const data = await res.data; // 等待解析完成
        return data;
    } catch (e) {
        return null;
    }
}
export async function fetchPreviewImg(filePath: string, auth_id: string): Promise<Buffer | null> {
    try {
        const res = await axios.get('http://110.42.45.189:16000/api/preview-img', {
            params: { filePath, auth_id },
            responseType: 'arraybuffer'
        });
        return Buffer.from(res.data);
    } catch (e) {
        return null;
    }
}
export async function deleteItems(paths: string[], auth_id: string) {
    try {
        const res = await axios.post('http://110.42.45.189:16000/api/delete-items', {
            items: paths,
            auth_id
        });
        return res.data;
    } catch (e) {
        return null;
    }
}
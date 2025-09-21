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

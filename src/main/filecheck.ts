import axios from 'axios';



// 用于真实后端接口
export async function fetchItems(path: string) {
    try {
        const res = await axios.get('http://110.42.45.189:16000/api/list-files', {
            params: { path: path || '' }
        });
        // 转换后端返回结构为 [{ name, isDirectory }]
        return (res.data.files || []).map((f: any) => ({
            name: f.name,
            isDirectory: f.is_dir
        }));
    } catch (e) {
        return [];
    }
}
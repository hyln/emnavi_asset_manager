import axios from 'axios';

interface VerifyTOTPParams {
    uuid: string;
    token: string; // 6-digit TOTP code
}
const SERVER_IP = 'http://110.42.45.189:6000'; // 替换为你的服务器地址
export async function verifyTOTP({ uuid, token }: VerifyTOTPParams): Promise<boolean> {
    try {
        const response = await axios.post(
            `${SERVER_IP}/api/auth/verify-totp`,
            { uuid, token }
        );
        return response.data.status === "ok";
    } catch (error) {
        return false;
    }
};
import axios from 'axios';

interface VerifyTOTPParams {
    server_url: string;
    uuid: string;
    token: string; // 6-digit TOTP code
}
export async function verifyTOTP({server_url, uuid, token }: VerifyTOTPParams): Promise<boolean> {
    try {
        const response = await axios.post(
            `${server_url}/api/auth/verify-totp`,
            { uuid, token }
        );
        return response.data.status === "ok";
    } catch (error) {
        return false;
    }
};
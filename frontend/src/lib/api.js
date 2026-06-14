import { env } from '$env/dynamic/public'

const BASE = env.PUBLIC_API_URL

export const api = {
    login: () => `${BASE}/api/auth/login`,
    register: () => `${BASE}/api/auth/register`,
}
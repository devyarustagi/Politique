import { env } from '$env/dynamic/public'
import { trainArmy } from './trainArmy'
import { upgradeBuilding } from './upgradeBuilding'

const BASE = env.PUBLIC_API_URL

export const api = {
    login: () => `${BASE}/api/auth/login`,
    register: () => `${BASE}/api/auth/register`,
    load: () => `${BASE}/api/user/load`,
    move: () => `${BASE}/api/user/layout/move`,
    refresh: () => `${BASE}/api/auth/refresh`,
    newBuilding: () => `${BASE}/api/user/layout`,
    army: () => `${BASE}/api/user/army`,
    battle: () => `${BASE}/api/user/battle`,
    upgradeBuilding: () => `${BASE}/api/user/layout/upgrade`,
    collectResource: () => `${BASE}/api/user/resources`
}
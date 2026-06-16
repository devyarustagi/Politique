import { api } from "$lib/api/apiRoutes.js";
import { browser } from "$app/environment";
import { gameinfo } from "$lib/gameState.svelte"; 
export const ssr = false;
export async function load({ fetch }) {
    if (!gameinfo.isLoaded) {
        try {
            const response = await fetch(api.load(), {
                method: "GET",
				credentials: "include",
            });
            if (!response.ok) {
                throw new Error(`Go API error: ${response.status}`);
            }
            const data = await response.json();
			
            Object.assign(gameinfo.info, data); 
            gameinfo.isLoaded = true;

        } catch (error) {
            console.error("Game loading failed:", error.message);
            return { success: false };
        }
    }

    return { success: true };
}
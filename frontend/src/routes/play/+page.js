import { api } from "$lib/api/apiRoutes.js";
import { gameinfo, isLoggedIn } from "$lib/gameState.svelte";
import { goto } from "$app/navigation";
export const ssr = false;
export async function load({ fetch }) {
    if (!isLoggedIn()) {
        await goto("/register");
        return;
    }
    if (!gameinfo.isLoaded) {
        try {
            const response = await fetch(api.load(), {
                method: "GET",
				credentials: "include",
            });
            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
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
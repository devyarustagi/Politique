import { isLoggedIn } from "$lib/gameState.svelte";
import { goto } from "$app/navigation";
export const ssr = false;
export async function load({ fetch }) {
    if (isLoggedIn()) {
        await goto("/play");
        return;
    }
}
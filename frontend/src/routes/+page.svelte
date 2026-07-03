<script>
    import { isLoggedIn } from "$lib/gameState.svelte";
	import { goto } from "$app/navigation";
    if (isLoggedIn()) {
        goto("/play");
    } else { 
        goto("/register");
    }
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="
https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>

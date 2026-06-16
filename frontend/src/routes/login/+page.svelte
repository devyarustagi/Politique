<script lang="ts">
    import BgImage from '$lib/assets/Login.webp';
    import ErrorBox from '$lib/components/auth/error-box.svelte';
    import AuthLink from '$lib/components/auth/auth-link.svelte';
    import { api } from '$lib/api/apiRoutes.js'
	import { goto } from '$app/navigation';
    
    let username: string = $state("");
    let password: string = $state("");
    let errorMessage: string = $state("");
    
    async function handleLogin(event: Event) {
        event.preventDefault();
        errorMessage = ""; 
        
        if (password.length > 72) {
            return;
        }

        try {
            const response = await fetch(api.login(), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({
                    "username": username,
                    "password": password
                })
            });

            if (response.ok) {
                console.log("Login successful");
                    goto("/play")
            } else {
                if (response.status === 401) {
                    errorMessage = "Username or password do not match.";
                } else {
                    errorMessage = "An error occurred. Please try again."; 
                }
            }
        } catch (error) {
            errorMessage = "Network error. Could not connect to server.";
            console.error("Network error:", error);
        }
    }
</script>

<div class="viewport" style:--bg-url="url({BgImage})">
    <form onsubmit={handleLogin}>
        <div class="input-group">
            <label for="username">Username</label>
            <input id="username" type="text" bind:value={username} required />
        </div>

        <div class="input-group">
            <label for="password">Password</label>
            <input id="password" type="password" bind:value={password} required />
        </div>
        {#if errorMessage && (username || password)}
            <ErrorBox msg={errorMessage}></ErrorBox>
        {/if}

        <button type="submit">Login</button>
        <AuthLink 
        msg = "Don't have an account?"
        route = "/register"
        linkText = "Register" 
        />
    </form>
</div>

<style>
    .viewport {
        background-image: var(--bg-url);
        background-attachment: fixed;
        background-size: cover;
        background-position: center; 
        width: 100vw;
        height: 100vh; 
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center; 
    }
    form {
        background: rgba(0, 0, 0, 0.75);
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 2rem;
        border-radius: 2rem;
        width: 15%;
        max-width: 400px;
        min-width: 100px;
    }
    form label {
        color: white;
        font-size: 1rem;
    }
    .input-group {
        display: flex;
        flex-direction: column;
        margin-bottom: 0.5rem;
    }
    button {
        font-size: 1rem;
        background-color: white;
        border-radius: 2rem;
        padding: 0.5rem;
        cursor: pointer;
        margin-top: 0.5rem;
    }
</style>
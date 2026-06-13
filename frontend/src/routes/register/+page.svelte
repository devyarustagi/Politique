<script lang="ts">
    import BgImage from '$lib/assets/Login.webp'; 
    import ErrorBox from '$lib/components/auth/error-box.svelte';
    import AuthLink from '$lib/components/auth/auth-link.svelte';
    
    let username: string = $state("");
    let password: string = $state("");
    let confirmPassword: string = $state("");
    let errorMsg: string = $state("");
    
    async function handleRegister(event: Event) {
        event.preventDefault();
        errorMsg = "";
        console.log("Register triggered:", username);
        if (password.length > 72) {
            return;
        }
        if (password !== confirmPassword) {
            return;
        }

        try {
            const response = await fetch("http://localhost:3000/api/auth/register", {
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
                console.log("Registration successful");
            } else if (response.status === 409 ){
                errorMsg = "Username already taken, please choose another one.";
            }
        } catch (error) {
            console.error("Network error:", error);
        }
    }
</script>

<div class="viewport" style:--bg-url="url({BgImage})">
    <form onsubmit={handleRegister}>
        <div class="input-group">
            <label for="username">Username</label>
            <input id="username" type="text" bind:value={username} required />
        </div>
        {#if errorMsg && username}
            <ErrorBox msg={errorMsg}></ErrorBox>
        {/if}
        <div class="input-group">
            <label for="password">Password</label>
            <input id="password" type="password" bind:value={password} required />
        </div>
        {#if password.length > 72}
                <ErrorBox msg="Password should be less than 73 characters in length."></ErrorBox>
        {/if}

        <div class="input-group">
            <label for="confirmPassword">Confirm Password</label>
            <input id="confirmPassword" type="password" bind:value={confirmPassword} required />
        </div>
        {#if confirmPassword.length > 0 && password !== confirmPassword}
                <ErrorBox msg="Passwords do not match."></ErrorBox>
        {/if}

        <button type="submit">Register</button>
        <AuthLink 
        msg = "Already have an account?"
        route = "/login"
        linkText = "Login" 
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
        margin-bottom: 1rem;
    }
    button {
        font-size: 1rem;
        background-color: white;
        border-radius: 2rem;
        padding: 0.5rem; 
        cursor: pointer;
    }
    
</style>
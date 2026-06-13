<script>
    let { msg, route, linkText } = $props();
</script>

<div class="auth-link">
    {msg} <a href={route}>{linkText}</a>
</div>

<style>
.auth-link {
    color: white;
    font-size: 1rem;
    text-align: center;
    margin-top: 1rem;
}

.auth-link a {
    color: #4da6ff;
    text-decoration: none;
    font-weight: bold;
}

.auth-link a:hover {
    text-decoration: underline;
}
</style>
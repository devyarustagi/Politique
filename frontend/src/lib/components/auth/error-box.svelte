<script>
    let { msg } = $props();
</script>

<div>{msg}</div>

<style>
    div {
        background-color: rgba(255, 0, 0, 0.15); 
        color: #ff6b6b; 
        border: 1px solid #ff6b6b;
        padding: 0.75rem;
        border-radius: 0.5rem;
        text-align: center;
        font-size: 1rem;
    }
</style>
<script>
    import { onMount, onDestroy } from 'svelte';
    import Phaser from 'phaser';
    import { ResidenceScene } from '$lib/scenes/residence';
    
    let gameContainer;
    let game;
      
    onMount(() => {
        const config = {
            type: Phaser.AUTO,
            backgroundColor: "#71e026",
            width: 1408, 
            height: 1408,
            title: "Politique",
            parent: gameContainer,
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH,
            },
            pixelArt: true, 
            scene: [ResidenceScene]
            }
        game = new Phaser.Game(config);
        });
    onDestroy(() => {
        if (game) {
            game.destroy(true);
        }
    });
</script>

<style>
    :global(canvas) {
        display: block; 
    }
</style>

<div bind:this={gameContainer} style="
    position: absolute;
    top:0;
    left:0;
    box-sizing: border-box; 
    height: 100%; 
    width: 100%; 
    background-color: #FFF;">
</div>
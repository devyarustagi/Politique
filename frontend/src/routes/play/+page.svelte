<script>
    import { onMount, onDestroy } from 'svelte';
    import Phaser from 'phaser';
    import { ResidenceScene } from '$lib/scenes/residence';
    import { gameinfo, resources, userArmy } from '$lib/gameState.svelte';
	import { ShopScene } from '$lib/scenes/shop';
	import { ChooseArmyScene } from '$lib/scenes/army';
	import { BattleScene } from '$lib/scenes/battle';
    import { BattleUIScene } from '$lib/scenes/battleui';
	import { BattleResultScene } from '$lib/scenes/battleresult';
    import { collectResource } from '$lib/api/collectResource';
	import { LeaderboardScene } from '$lib/scenes/leaderboard';
    import { getLeaderboardData } from '$lib/api/leaderboard';
    let gameContainer;
    let game;

    onMount(() => {
        resources.oil = gameinfo.info.residence.oil;
        resources.gems = gameinfo.info.residence.gems;
        resources.residenceLevel = gameinfo.info.residence.residence_level;
        gameinfo.info.village_layout.forEach((buildingData) => {
            const building = gameinfo.info.buildings_master_table[buildingData.type_id - 1];
            if (building.building_type === "storage"){
                const amt = gameinfo.info.storages.find(x => x.building_id === building.building_id).storage_capacity
                if( building.building_name !== "Mercenary-Camp") {
                    resources.oilCap += amt;
                }
                else {
                    resources.armyCap += amt;
                }
            }
        });

        //make storage capacities derived state of residenceLevel later
        if(gameinfo.info.army !== null)
        {   let index = 0;
            //rely on the invariant that the army comes from the server sorted by merc id and the mercs table aslo comes sorted
            for(const troop of gameinfo.info.mercs){ 
                if(troop.unlock_level !== resources.residenceLevel) continue;
                let baseIndex = troop.mercenary_id - 1;
                const troopName = gameinfo.info.mercs[baseIndex].mercenary_name;
                let idx = 0;
                let ct = 0;
                if( index < gameinfo.info.army.length && gameinfo.info.army[index].mercenary_id === troop.mercenary_id) {
                    ct = gameinfo.info.army[index].count;
                    index++;
                }
                while ( baseIndex + idx < gameinfo.info.mercs.length && 
                gameinfo.info.mercs[baseIndex + idx].mercenary_name === troopName )
                {
                    userArmy.push({
                        ...gameinfo.info.mercs[baseIndex + idx],
                        count: ct
                    });
                    idx += 1;
                }
                resources.armySz += (ct * troop.housing_space);
                    
            }
        }
        else {
            gameinfo.info.mercs.forEach((troop) => {
                if( troop.unlock_level >= resources.residenceLevel ){
                    userArmy.push(
                        {
                            ...troop,
                            count: 0
                        }
                    )
                }
            })
        }
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
            scene: [ResidenceScene, ShopScene, ChooseArmyScene, BattleScene, BattleUIScene, BattleResultScene, LeaderboardScene]
            }
            game = new Phaser.Game(config);
        });
        onDestroy(() => {
            if (game) {
                game.destroy(true);
            }
        });

    function getActiveScene(){
        return game.scene.getScenes(true)[0].sys.config;
    }

    function openShop() {
        if (!game) return;
        const currScene = getActiveScene();
        if(currScene === "ResidenceScene"){
            const unlockedItems = []
            const residencelvl = gameinfo.info.residence.residence_level;
            gameinfo.info.buildings_master_table.forEach((buildingData) => {
                if(buildingData.building_level === 1 && buildingData.building_name !== 'Residence'){
                    unlockedItems.push({
                        id: buildingData.building_id, 
                        name: buildingData.building_name,
                        cost: buildingData.upgrade_cost,
                        textureKey: `${buildingData.building_name}1`
                    })
                }
            })
            game.scene.pause('ResidenceScene');
            game.scene.run('ShopScene', { items: unlockedItems });
        }
        else if(currScene === "ShopScene"){
            game.scene.stop('ShopScene');
            game.scene.resume("ResidenceScene");
        }
    }

    function chooseArmy() {
        if (!game) return;
        const currScene = getActiveScene();
        if(currScene === "ResidenceScene"){
            game.scene.pause('ResidenceScene');
            game.scene.run('ChooseArmyScene');
        }
        else if(currScene === "ChooseArmyScene"){
            game.scene.stop("ChooseArmyScene");
            game.scene.resume("ResidenceScene");
        }
    }
    async function openLeaderboard() {
        if (!game) return;
        const currScene = getActiveScene();
        if(currScene === "ResidenceScene"){
            const leaderboardData = await getLeaderboardData();
            if( leaderboardData === false ){
                return;
            }
            game.scene.pause('ResidenceScene');
            game.scene.run('LeaderboardScene', leaderboardData);
        }
        else if(currScene === "LeaderboardScene"){
            game.scene.stop('LeaderboardScene');
            game.scene.resume('ResidenceScene');
        } 
    }
    
    async function getOil(){
        const amt = await collectResource({resource: "oil"})
        resources.oil += amt.amount
    }
    async function getGems(){
        const amt = await collectResource({resource: "gems"})
        resources.gems += amt.amount
    }
</script>

<div class="desk-background">
    <div class="psp-device">
        
        <div class="psp-controls left-controls d-pad-container">
            <div class="d-pad-row">
                <button class="psp-btn d-pad-btn" >💀</button>
            </div>
            <div class="d-pad-row center-row">
                <button class="psp-btn d-pad-btn" onclick={getOil}>🛢️</button>
                <div class="d-pad-center"></div> 
                <button class="psp-btn d-pad-btn" onclick={getGems}>💎</button>
            </div>
            <div class="d-pad-row">
                <button class="psp-btn d-pad-btn" onclick={openLeaderboard}>📊</button>
            </div>
        </div>

        <div class="psp-screen-bezel">
            <div bind:this={gameContainer} class="psp-screen"></div>
        </div>

        <div class="psp-controls right-controls">
            <div class="resource-panel">
                <div class="resource-pill username">
                    <span class="resource-icon">🆔</span>
                    <span class="resource-value">{gameinfo.info.residence.username}</span>
                </div>
                <div class="resource-pill dark-elixir">
                    <span class="resource-icon">🛢️</span>
                    <span class="resource-value">{resources.oil}/{resources.oilCap}</span>
                </div>
                <div class="resource-pill gems">
                    <span class="resource-icon">💎</span>
                    <span class="resource-value">{resources.gems}</span>
                </div>
            </div>
            <button class="psp-btn action-btn green" onclick={openShop}>🛒</button>
            <button class="psp-btn action-btn red" onclick={chooseArmy}>⚔️</button>
        </div>

    </div>
</div>

<style>
    /* 1. The Desk (Spotlight Effect) */
    :global(html, body) {
        margin: 0; padding: 0;
        width: 100%; height: 100%;
        background: radial-gradient(circle at 50% 50%, #2d3748 0%, #1a202c 60%, #000000 100%);
        display: flex;
        justify-content: center;
        align-items: center;
        overflow: hidden;
    }
    
    :global(canvas) { display: block; }

    .desk-background {
        width: 100%; height: 100%;
        display: flex; justify-content: center; align-items: center;
    }

    /* 2. The Premium Metallic Green Console Body */
    .psp-device {
        display: flex;
        flex-direction: row;
        align-items: center;
        /* Metallic green sweep mimicking light reflecting off curved metal */
        background: linear-gradient(
            135deg, 
            #173824 0%, 
            #0a1c11 30%, 
            #2e6b45 50%, 
            #0a1c11 70%, 
            #122b1a 100%
        ); 
        padding: 30px;
        border-radius: 60px; 
        /* Outer highlights to separate it from the desk */
        border-top: 2px solid #4a8f63; 
        border-bottom: 2px solid #030805;
        border-left: 1px solid #2e6b45;
        border-right: 1px solid #173824;
        box-shadow: 
            0 40px 70px rgba(0,0,0,0.95), /* Heavy desk drop shadow */
            inset 0 12px 20px rgba(255,255,255,0.15), /* Top rim shine */
            inset 0 -15px 25px rgba(0,0,0,0.9); /* Bottom rim shadow */
        gap: 30px;
        width: 95vw;
        max-width: 1300px; 
        height: 85vh;
        max-height: 850px;
    }

    /* 3. The Bezel & Glass Glare */
    .psp-screen-bezel {
        flex-grow: 1; 
        height: 100%;
        background: #050505;
        border-radius: 15px;
        padding: 15px;
        box-shadow: 
            inset 0 0 30px rgba(0,0,0,1), 
            0 2px 3px rgba(255,255,255,0.15), /* Inner metal lip catching light */
            0 -1px 2px rgba(0,0,0,0.8);
        position: relative;
    }

    .psp-screen {
        width: 100%; height: 100%;
        border-radius: 8px;
        overflow: hidden;
        background: #000; /* Fallback before game loads */
    }

    /* 4. The Controls Layout */
    .psp-controls {
        display: flex;
        flex-direction: column;
        justify-content: center;
        width: 160px;
        height: 100%;
    }

    .d-pad-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
    }
    
    .d-pad-row {
        display: flex;
        justify-content: center;
        gap: 5px;
    }
    
    .center-row { align-items: center; }
    .d-pad-center { width: 50px; height: 50px; }

    .right-controls { 
        align-items: center; 
        gap: 40px; 
    }
    /* 6. Resource Readout Pills */
    .resource-panel {
        display: flex;
        flex-direction: column;
        gap: 15px;
        width: 100%;
        margin-bottom: 10px; /* Small push to separate from the action buttons */
    }

    .resource-pill {
        display: flex;
        align-items: center;
        justify-content: space-between;
        /* Very dark background mimicking a turned-off LCD screen */
        background: linear-gradient(180deg, #050505 0%, #151515 100%);
        border-radius: 30px; /* Perfect pill shape */
        padding: 8px 15px;
        /* Creating the embedded metal cutout look */
        border-top: 2px solid #000;
        border-bottom: 1px solid #3a7a50; /* Catching the metallic green ambient light */
        box-shadow: 
            inset 0 4px 8px rgba(0,0,0,0.9), /* Deep internal shadow */
            0 2px 5px rgba(0,0,0,0.5);
        min-width: 110px;
    }

    .resource-icon {
        font-size: 18px;
        filter: drop-shadow(0 2px 2px rgba(0,0,0,0.8)); /* Pops the emoji off the dark screen */
    }

    .resource-value {
        font-family: "Courier New", Courier, monospace; /* Classic digital readout font */
        font-size: 0.625rem;
        font-weight: 900;
        letter-spacing: 1px;
    }

    .resource-pill.dark-elixir .resource-value {
        color: #e9d5ff; 
        text-shadow: 0 0 8px #9333ea, 0 0 15px #7e22ce, 0 0 20px #581c87;
    }

    .resource-pill.gems .resource-value {
        color: #a7f3d0; 
        text-shadow: 0 0 8px #10b981, 0 0 15px #059669, 0 0 20px #047857;
    }

    .resource-pill.username .resource-value {
        color: #dddf5a; 
        text-shadow: 0 0 8px #e7be0c, 0 0 15px #d2af32, 0 0 20px #a77012;
    }

    /* 5. The Physical Buttons */
    .psp-btn {
        display: flex;
        justify-content: center;
        align-items: center;
        border: none;
        cursor: pointer;
        transition: all 0.1s;
    }

    /* Upgraded D-Pad Buttons (Premium Plastic/Metal look) */
    .d-pad-btn {
        width: 50px; height: 50px;
        border-radius: 10px; 
        background: linear-gradient(180deg, #3a3a3a 0%, #1a1a1a 100%);
        border: 1px solid #111;
        font-size: 20px;
        box-shadow: 
            0 6px 0 #080808, 
            0 10px 15px rgba(0,0,0,0.7), 
            inset 0 2px 4px rgba(255,255,255,0.15);
    }
    
    .d-pad-btn:active {
        transform: translateY(6px);
        box-shadow: 
            0 0px 0 #080808, 
            0 4px 6px rgba(0,0,0,0.6),
            inset 0 1px 3px rgba(0,0,0,0.5);
    }

    /* Massive Action Buttons */
    .action-btn {
        width: 90px; height: 90px;
        border-radius: 50%; 
        font-size: 35px; 
        box-shadow: 
            0 8px 0 rgba(0,0,0,0.6), 
            0 15px 25px rgba(0,0,0,0.7), 
            inset 0 4px 10px rgba(255,255,255,0.2);
    }
    
    /* Tweaked action button gradients for better depth */
    .action-btn.green { 
        background: radial-gradient(circle at 35% 35%, #2ecc71, #1e8248); 
        box-shadow: 0 8px 0 #104a28, 0 15px 25px rgba(0,0,0,0.7), inset 0 4px 10px rgba(255,255,255,0.3);
    }
    .action-btn.green:active { transform: translateY(8px); box-shadow: 0 0 0 #104a28, inset 0 2px 5px rgba(0,0,0,0.4); }

    .action-btn.red { 
        background: radial-gradient(circle at 35% 35%, #e74c3c, #962c21); 
        box-shadow: 0 8px 0 #5c1811, 0 15px 25px rgba(0,0,0,0.7), inset 0 4px 10px rgba(255,255,255,0.3);
    }
    .action-btn.red:active { transform: translateY(8px); box-shadow: 0 0 0 #5c1811, inset 0 2px 5px rgba(0,0,0,0.4); }
</style>
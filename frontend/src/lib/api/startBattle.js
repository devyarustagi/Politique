import { api } from "./apiRoutes";
import { refreshJWT } from "./refreshJWT";

export async function startBattle(){

    try {
        const response = await fetch(api.battle(), {
            method: "GET",
            credentials: "include"
        })
        if (response.ok) {
            const res = await response.json();
            if (res.is_valid === false) {
                throw new Error("Matchmaking failed as no opponents were found. Please try again later.")
            }
            return res;
        }
        if (response.status === 401){
            let ok = await refreshJWT();
            if (!ok) {
                return false;
            }
            return await startBattle();
        }
        throw new Error("Sorry! We are having server troubles at the time.");
    }
    catch (error) {
        if (error instanceof TypeError) {
            window.phaserGame.scene.run('ErrorScene', {message: "Request could not be processed. Please check your network connection and try again." });
        } else {
            window.phaserGame.scene.run('ErrorScene', { message: error.message });
        }
        return false;
    }
}

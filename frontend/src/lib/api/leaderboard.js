import { api } from "./apiRoutes";
import { refreshJWT } from "./refreshJWT";

export async function getLeaderboardData(){
    try {
        const response = await fetch(api.leaderboard(), {
            method: "GET",
            credentials: "include"
        })
        if (response.ok) {
            return await response.json();
        }
        if (response.status === 401){
            let ok = await refreshJWT();
            if (!ok) {
                return false;
            }
            return await getLeaderboardData();
        }
        throw new Error("Sorry! We are having server troubles at the time.");
    }
    catch (error) {
        if (error instanceof TypeError) {
            window.phaserGame.scene.run('ErrorScene', { message : "Request could not be processed. Please check your network connection and try again." });
        } else {
            window.phaserGame.scene.run('ErrorScene', { message : error.message });
        }
        return false;
    }
}

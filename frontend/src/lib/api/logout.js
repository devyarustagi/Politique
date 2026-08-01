import { api } from "./apiRoutes";
import { refreshJWT } from "./refreshJWT";

export async function logout(){
    try {
        const response = await fetch(api.logout(), {
            method: "POST",
            credentials: "include"
        })
        if (response.ok) {
            return true;
        }
        if (response.status === 401){
            let ok = await refreshJWT();
            if (!ok) {
                return false;
            }
            return await logout();
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

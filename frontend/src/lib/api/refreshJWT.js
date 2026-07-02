import { api } from "./apiRoutes";
import { goto } from "$app/navigation";

export async function refreshJWT(){
    try{
        const response = await fetch(api.refresh(),{
            method: "POST",
            credentials: "include"
        });
        if (response.ok) {
            return true;
        }
        else if (response.status === 401) {
            alert("Session timed out. Please re-login.")
            goto("/login");
            return false;
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
import { api } from "./apiRoutes";
import { refreshJWT } from "./refreshJWT";

export async function addBuilding(newBuildingData){
    try {
        const response = await fetch(api.newBuilding(), {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify(newBuildingData)
        })
        if (response.ok) {
            return await response.json();
        }
        if (response.status == 401){
            let ok = await refreshJWT();
            if (!ok) {
                return false;
            }
            ok = await newBuilding(newBuildingData);
            return ok;
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
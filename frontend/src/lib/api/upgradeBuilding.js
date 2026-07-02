import { api } from "./apiRoutes";
import { refreshJWT } from "./refreshJWT";

export async function upgradeBuilding(upgradeInfo){
    try {
        const response = await fetch(api.upgradeBuilding(), {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify(upgradeInfo)
        })
        if (response.ok) {
            return true;
        }
        if (response.status == 401){
            let ok = await refreshJWT();
            if (!ok) {
                return false;
            }
            ok = await upgradeBuilding(upgradeInfo);
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

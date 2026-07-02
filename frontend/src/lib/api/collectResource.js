import { api } from "./apiRoutes";
import { refreshJWT } from "./refreshJWT";

export async function collectResource(resource){
    try {
        const response = await fetch(api.collectResource(), {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify(resource)
        })
        if (response.ok) {
            return await response.json();
        }
        if (response.status == 401){
            let ok = await refreshJWT();
            if (!ok) {
                throw new Error("server error");
            }
            const amt = await collectResource(resource);
            return await amt.json();
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

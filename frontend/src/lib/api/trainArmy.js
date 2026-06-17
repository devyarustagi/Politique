import { api } from "./apiRoutes";
import { refreshJWT } from "./refreshJWT";
import { userArmy, resources } from "$lib/gameState.svelte";

export async function trainArmy(){
    const requestBody = [];
    userArmy.forEach(troop => {
        if( troop.count > 0 && troop.unlock_level === resources.residenceLevel ){
            requestBody.push({
                mercenary_id: troop.mercenary_id,
                count: troop.count
            })
        }
    })
    try {
        const response = await fetch(api.army(), {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify(requestBody)
        })
        if (response.ok) {
            return true;
        }
        if (response.status == 401){
            let ok = await refreshJWT();
            if (!ok) {
                return false;
            }
            ok = await trainArmy();
            return ok;
        }
        throw new Error("server error");
    }
    catch (error) {
        if (error instanceof TypeError) {
            console.error(error)
            alert("Request could not be processed. Please check your network connection and try again.");
            return false;
        } else {
            console.error("Unexpected error:", error.message);
            alert("Something went wrong. Please try again.");
            return false;
        }
    }
}

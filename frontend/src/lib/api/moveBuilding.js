import { api } from "./apiRoutes";
import { refreshJWT } from "./refreshJWT";

export async function moveBuilding(buildingID, newX, newY){
    try {
        const response = await fetch(api.move(), {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                "global_id": buildingID,
                "x_coordinate": newX,
                "y_coordinate": newY
            })
        })
        if (response.ok) {
            return true;
        }
        if (response.status == 401){
            let ok = await refreshJWT();
            if (!ok) {
                return false;
            }
            ok = await moveBuilding(buildingID, newX, newY);
            return ok;
        }
        throw new Error("server error");
    }
    catch (error) {
        if (error instanceof TypeError) {
            alert("Request could not be processed. Please check your network connection and try again.");
            return false;
        } else {
            console.error("Unexpected error:", error.message);
            alert("Something went wrong. Please try again.");
            return false;
        }
    }
}

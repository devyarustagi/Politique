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

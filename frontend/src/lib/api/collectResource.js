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

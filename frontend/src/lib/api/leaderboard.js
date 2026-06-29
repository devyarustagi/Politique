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

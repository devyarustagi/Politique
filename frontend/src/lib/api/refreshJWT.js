import { api } from "./apiRoutes";
import { goto } from "$app/navigation";

export async function refreshJWT(){
    try{
        const response = await fetch(api.refresh(),{
            method: "GET",
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
        else {
            throw new Error("server error")
        }
    }
    catch (error){
        if (error instanceof TypeError) {
        alert("Request could not be processed. Please check your network connection and try again.");
    } else {
        console.error("Unexpected error:", error.message);
        alert("Something went wrong. Please try again.");
    }
    return false;
    }
}
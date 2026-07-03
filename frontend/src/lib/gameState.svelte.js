export const gameinfo = $state({
    isLoaded: false,
    info: {}
});
export const resources = $state({
    residenceLevel: 0,
    oil: 0,
    gems: 0,
    oilCap: 0,
    armySz: 0,
    armyCap: 0
})

export function isLoggedIn() {
    console.log(document.cookie);
    return document.cookie
        .split(';')
        .some(row => row.trim().startsWith('isLoggedIn='));
}

export const userArmy = $state([]) 
let vars = {
    "game": "classic",
    "players": [true, 1],
    "mode": "",
    "map": "",
    "location": "",
    "playalert": true,
    "stop": false,
};

const Modes = {
    "tdm": 128,
    "ml": 138,
    "bd": 275,
    "cp": 135,
    "ve": 136,
    "gg": 15,
};

const Modes_long = {
    "Team Death Match": "tdm",
    "Missile Launch": "ml",
    "Bomb Disposal": "bd",
    "Capture Points": "cp",
    "Vehicle Escort": "ve",
    "Gun Game": "gg",
};

const Maps = {
    "area15base": 21,
    "area15bunker": 22,
    "citypoint": 13,
    "cologne": 44,
    "desert": 0,
    "escapes": 6,
    "flooded": 4,
    "frontier": 31,
    "goldmine": 47,
    "goldminev2": 49,
    "heist": 32,
    "kitchen": 29,
    "moonbase": 20,
    "northwest": 1,
    "office": 3,
    "pacific": 2,
    "remagen": 8,
    "siege": 39,
    "skullisland": 24,
    "southwest": 7,
    "spacestation": 38,
    "temple": 5,
    "thesomme": 15,
    "tomb": 14,
    "tribute": 18,
    "cyberpunk": 19,
    "zengarden": 43,
    "containers": 37,
    "crisscross": 40,
    "dwarfsdungeon": 28,
    "hanger": 25,
    "pyramid": 36,
    "quarry": 27,
    "sniperalley": 35,
    "snipersonly": 41,
    "threelane": 34,
    "towerofpower": 33,
};

const Maps_long = {
    "Area 15 Base": "area15base",
    "Area 15 Bunker": "area15bunker",
    "City Point": "citypoint",
    "Cologne": "cologne",
    "Desert": "desert",
    "Escape": "escapes",
    "Flooded": "flooded",
    "Frontier": "frontier",
    "Goldmine": "goldmine",
    "Goldmine V2": "goldminev2",
    "Heist": "heist",
    "Kitchen": "kitchen",
    "Moonbase": "moonbase",
    "Northwest": "northwest",
    "Office": "office",
    "Pacific": "pacific",
    "Remagen": "remagen",
    "Siege": "siege",
    "Skull Island": "skullisland",
    "Southwest": "southwest",
    "Space Station": "spacestation",
    "Temple": "temple",
    "The Somme": "thesomme",
    "Tomb": "tomb",
    "Tribute": "tribute",
    "Tribute (Cyberpunk)": "cyberpunk",
    "Zen Garden": "zengarden",
    "Containers": "containers",
    "Criss Cross": "crisscross",
    "Dwarf's Dungeon": "dwarfsdungeon",
    "Hanger": "hanger",
    "Pyramid": "pyramid",
    "Quarry": "quarry",
    "Sniper Alley": "sniperalley",
    "Snipers Only": "snipersonly",
    "Three Lane": "threelane",
    "Tower of Power": "towerofpower",
};

const classic = ["USA","USA_WEST","ASIA","JAPAN","EUROPE","INDIA","AUSTRALIA","RUSSIA"];
const fourvfour = ["USA_4V4","EU_4V4","ASIA_4V4"];

const Classic_maps = {
    "Area 15 Base": "area15base",
    "Area 15 Bunker": "area15bunker",
    "City Point": "citypoint",
    "Cologne": "cologne",
    "Desert": "desert",
    "Escape": "escapes",
    "Flooded": "flooded",
    "Frontier": "frontier",
    "Goldmine": "goldmine",
    "Goldmine V2": "goldminev2",
    "Heist": "heist",
    "Kitchen": "kitchen",
    "Moonbase": "moonbase",
    "Northwest": "northwest",
    "Office": "office",
    "Pacific": "pacific",
    "Remagen": "remagen",
    "Siege": "siege",
    "Skull Island": "skullisland",
    "Southwest": "southwest",
    "Space Station": "spacestation",
    "Temple": "temple",
    "The Somme": "thesomme",
    "Tomb": "tomb",
    "Tribute": "tribute",
    "Tribute (Cyberpunk)": "cyberpunk",
    "Zen Garden": "zengarden",
};

const Fourv4_maps = {
    "Containers": "containers",
    "Criss Cross": "crisscross",
    "Dwarf's Dungeon": "dwarfsdungeon",
    "Hanger": "hanger",
    "Pyramid": "pyramid",
    "Quarry": "quarry",
    "Sniper Alley": "sniperalley",
    "Snipers Only": "snipersonly",
    "Three Lane": "threelane",
    "Tower of Power": "towerofpower",
};

const Classic_regions = {
    "USA": "USA",
    "USA_WEST": "USA_WEST",
    "ASIA": "ASIA",
    "JAPAN": "JAPAN",
    "EUROPE": "EUROPE",
    "INDIA": "INDIA",
    "AUSTRALIA": "AUSTRALIA",
    "RUSSIA": "RUSSIA",
};

const Fourv4_regions = {
    "USA_4V4": "USA_4V4",
    "ASIA_4V4": "ASIA_4V4",
    "EU_4V4": "EU_4V4",
};

// ============================================================
//  index.js
// ============================================================

function loadparas() {
    const query = new URLSearchParams(window.location.search);
    const game = query.get("game");
    const alert = query.get("alert");
    const player = query.get("players");
    const mode = query.get("modes");
    const map = query.get("maps");
    const region = query.get("regions");

    const game_select = document.getElementById("game");

    if (game != null) {
        if (game.toLowerCase() == "classic") {
            game_select.selectedIndex = 0;
        } else if (game.toLowerCase() == "4v4") {
            game_select.selectedIndex = 1;
            if_4v4("game","add_modes","modes_select","modes_list")
        } else {
            console.error("Unknown game '" + game + "'")
        }
    }

    if (alert != null) {
        if (alert.toLowerCase() == "true") {
            document.getElementById("alert").checked = true;
        } else if (alert.toLowerCase() == "false") {
            document.getElementById("alert").checked = false;
        } else {
            console.error("Unknown parameter '" + alert + "'");
        }
    }

    if (player != null) {
        let sign = player.slice(0,1);
        let players = player.slice(1,player.length);

        if (sign.toLowerCase() == "g") {
            document.getElementById("sign").selectedIndex = 0;
        } else if (sign.toLowerCase() == "l") {
            document.getElementById("sign").selectedIndex = 1;
        } else {
            console.error("Unknown sign '" + sign + "'");
        }

        if (!isNaN(parseInt(players))) {
            if (parseInt(players) <= 16 && parseInt(players) >= 1) {
                document.getElementById("players").selectedIndex = parseInt(players) - 1;
            } else {
                console.error("'" + players + "' is out of range.")
            }
        } else {
            console.error("Unknown number '" + players + "'." )
        }
    }

    if (mode != null && game_select.selectedIndex != 1) {
        modes = mode.split(",");
        for (let i in modes) {
            let select = document.getElementById(modes[i]);
            if (select != null) {
                select.click();
            }
        }
    }

    if (map != null) {
        maps = map.split(",");
        for (let i in maps) {
            let select = document.getElementById(maps[i]);
            if (select != null) {
                select.click();
            }
        }
    }

    if (region != null) {
        regions = region.split(",");
        for (let i in regions) {
            let select = document.getElementById(regions[i].toUpperCase());
            if (select != null) {
                select.click();
            }
        }
    }
}

function setup(gameid, alertid, signid, playerid) {
    let game = document.getElementById(gameid);
    let alert = document.getElementById(alertid);
    let sign = document.getElementById(signid);
    let player = document.getElementById(playerid);

    game.selectedIndex = 0;
    alert.checked = true;
    sign.selectedIndex = 0;
    player.selectedIndex = 0;
}

function collapse(part, self) {
    let parts = ["modes", "maps", "regions"];
    let img_parts = ["mode", "map", "reg"];

    let id = document.getElementById("add_" + parts[part]);
    let chevron = document.getElementById(self);

    parts.splice(part, 1);
    img_parts.splice(part, 1);

    if (id.style.display === "none") {
        id.style.display = "block";
        chevron.classList.add("open");

        for (let i=0; i<parts.length; i++) {
            document.getElementById("add_" + parts[i]).style.display = "none";
            document.getElementById(img_parts[i] + "_img").classList.remove("open");
        }
    } else {
        id.style.display = "none";
        chevron.classList.remove("open");
    }
}

function search(value, list) {
    let input = document.getElementById(value).value.toLowerCase();
    let terms = document.getElementById(list);
    let button = terms.getElementsByTagName("button");
    for (let i=0; i<button.length; i++) {
        item = button[i].textContent.toLowerCase();
        if (item.indexOf(input) > -1) {
            button[i].style.display = "";
        } else {
            button[i].style.display = "none";
        }
    }
}

function clearsearch(input) {
    document.getElementById(input).value = "";
}

function remove(el, item, base) {
    let selection = item.innerHTML;
    let all = document.getElementById("all_" + base);
    let preview = ", " + all.textContent;

    item.disabled = false;
    el.remove();

    preview = preview.replace(", " + selection, "");

    if (preview[0] == ",") {
        preview = preview.slice(2);
    }

    if (preview == "") {
        preview = "ALL";
    }

    all.textContent = preview;
    liveUpdate();
}

function select(item, display, base) {
    let selection = document.getElementById(item);
    let show = document.getElementById(display);
    let id = selection.value + "_select";
    let all = document.getElementById("all_" + base);
    let preview = all.textContent;

    if (preview === "ALL") {
        preview = selection.innerHTML;
    } else {
        preview += ", " + selection.innerHTML;
    }

    all.textContent = preview;

    selection.disabled = true;

    show.innerHTML += `<span id="${id}"><a>${selection.innerHTML}</a> <button onclick="remove(${id},${item},'${base}')">X</button>&nbsp;&nbsp;<span>`

    liveUpdate();
}

function populate(base, list) {
    let id = base + "_list";
    let select = base + "_select"

    let modes = "";

    for (let i in list) {
        modes += `<button value="${list[i]}" id="${list[i]}" onclick="select(this.value,'${select}','${base}')">${i}</button>`
    }

    document.getElementById(id).innerHTML = "";
    document.getElementById(id).innerHTML = modes;
}

function if_4v4(id, add, select, list) {
    let game = document.getElementById(id);
    let mode = document.getElementById("mode");
    let modes = document.getElementById(add)
    let selected = document.getElementById(select);
    let listed = document.getElementById(list).getElementsByTagName('*');

    if (game.options[game.selectedIndex].text == "4v4") {
        mode.style.pointerEvents = "none";
        mode.style.backgroundColor = "gray";
        modes.style.display = "none";
        document.getElementById("mode_img").classList.remove("open")
        document.getElementById("all_modes").textContent = "ALL";
        document.getElementById("all_maps").textContent = "ALL";
        document.getElementById("all_regions").textContent = "ALL";

        selected.innerHTML = "";
        document.getElementById("maps_select").innerHTML = "";
        document.getElementById("regions_select").innerHTML = "";

        populate("maps", Fourv4_maps)
        populate("regions", Fourv4_regions)

        for (let i=0; i<listed.length; i++) {
            listed[i].disabled = false;
        }
    } else if (game.options[game.selectedIndex].text == "Classic") {
        mode.style.pointerEvents = "auto";
        mode.style.backgroundColor = "";

        populate("maps", Classic_maps)
        populate("regions", Classic_regions)
    }
}

function pre_data(gameid, alertid, signid, playersid) {
    let game = document.getElementById(gameid);
    let alert = document.getElementById(alertid);
    let sign = document.getElementById(signid);
    let players = document.getElementById(playersid);

    let select_game = game.options[game.selectedIndex].text;
    let select_alert = alert.checked;
    let select_sign = sign.options[sign.selectedIndex].text
    let select_players = players.options[players.selectedIndex].text

    if (select_sign == "Greater") {
        select_sign = true;
    } else if (select_sign == "Less") {
        select_sign = false;
    }

    vars["playalert"] = select_alert;
    vars["game"] = select_game;
    vars["players"] = [select_sign, parseInt(select_players)];
}

function collect_data(id) {
    let data = "";

    let list = document.getElementById(id);
    let button = list.getElementsByTagName("button");

    for (let i=0; i<button.length; i++) {
        if (button[i].disabled) {
            data += button[i].value + ",";
        }
    }

    data = data.slice(0, -1);
    return data;
}

// Live update vars from current UI state (used when scan is already running)
function liveUpdate() {
    pre_data('game', 'alert', 'sign', 'players');
    vars["mode"] = collect_data("modes_list");
    vars["map"] = collect_data("maps_list");
    vars["location"] = collect_data("regions_list");
}

function save_config() {
    let game = document.getElementById("game");
    let alert = document.getElementById("alert").checked;
    let sign = document.getElementById("sign").selectedIndex;
    let players = document.getElementById("players").selectedIndex;
    let modes = collect_data("modes_list");
    let maps = collect_data("maps_list");
    let regions = collect_data("regions_list");

    if (sign == 0) {
        sign = "G";
    } else {
        sign = "L";
    }

    let params = window.location.href.split("?")[0] + "?game=" + game[game.selectedIndex].value + "&alert=" + alert + "&players=" + sign + (players + 1).toString();

    if (modes != "") {
        params += "&modes=" + modes;
    }

    if (maps != "") {
        params += "&maps=" + maps;
    }
    if (regions != "") {
        params += "&regions=" + regions;
    }

    return params
}

function show_config() {
    let popup = document.getElementById("grayout");
    let link = document.getElementById("saved_config");

    link.textContent = save_config();
    link.href = save_config();

    popup.style.display = "block";
}

function close_config(id) {
    document.getElementById(id).style.display = "none";
}

function startstop(id) {
    let button = document.getElementById(id);

    if (button.value == "start") {
        liveUpdate();

        wb_mapper("output","status","startstop");

        document.getElementById("output").innerHTML = "";
        document.getElementById("status").innerHTML = "MAPPING...";

        button.querySelector('.btn-text').textContent = "\u2B1B STOP SCAN";
        button.value = "stop";
    } else if (button.value == "stop") {
        vars["stop"] = true;

        console.log("Stopping...");
        document.getElementById("status").innerHTML = "STOPPING...";

        button.querySelector('.btn-text').textContent = "\u25B6 INITIATE SCAN";
        button.value = "start";
        button.disabled = true;
    } else {
        console.error("Bro, wut?!");
    }
}

document.addEventListener('visibilitychange', function(e) {
    if (!document.hidden) {
        document.title = "War Brokers Server Mapper";
    }
});

setup('game','alert','sign','players')
populate("modes", Modes_long)
populate("maps", Classic_maps)
populate("regions", Classic_regions)
loadparas();

// ============================================================
//  wb_mapper.js
// ============================================================

let endpoint = 303;
let minguess = 289;
let maxnumguess = 20;

async function fetch_server_data(region) {
    try {
        let failed = 1;
        let serverdata = [];
        let count = 0;

        while (failed) {
            if (count == maxnumguess) {
                console.error("Something went wrong. Please contact the developer. ")
                break;
            }

            const response = await fetch("https://store1.warbrokers.io/" + endpoint + "//server_list.php?location="+region);

            if (response.status == 404) {
                console.log("Endpoint: /" + endpoint + "//server_list.php returned 404. Retrying ...")

                if (count < 1) {
                    endpoint = minguess;
                }

                endpoint += 1;
                count += 1;

                console.log("Trying: " + endpoint);
                continue;
            }

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            failed = 0;

            serverdata = response.text().then(data => data.split(","+region+","));
        }

        return serverdata;
    }
    catch (error) {
        console.error(error);
    }
}

function set_data(game, players, mode, map, location) {
    let data = [];
    modes = mode;

    if (game.toLowerCase() != "classic" && game.toLowerCase() != "4v4") {
        console.error("Unknown game selected!");
    }

    let game_regions;

    if (game.toLowerCase() == "classic") {
        game_regions = classic;
    }
    else if (game.toLowerCase() == "4v4") {
        game_regions = fourvfour;
        modes = "";
    }

    data.push(game.toLowerCase());
    data.push(players);

    let striped_mode = mode.toLowerCase().split(" ").join("").split(",");

    if (modes == "") {
        data.push("all");
    }
    else if (striped_mode.every(key => Modes.hasOwnProperty(key))) {
        for (let i = 0; i < striped_mode.length; i++) {
            striped_mode[i] = Modes[striped_mode[i]];
        }
        data.push(striped_mode);
    }
    else {
        console.error("[ERROR]: Unknown mode selected!");
    }

    let striped_map = map.toLowerCase().split(" ").join("").split(",");

    if (map == "") {
        data.push("all");
    }
    else if (striped_map.every(key => Maps.hasOwnProperty(key))) {
        for (let i = 0; i < striped_map.length; i++) {
            striped_map[i] = Maps[striped_map[i]];
        }
        data.push(striped_map);
    }
    else {
        console.error("[ERROR]: Unknown map selected!");
    }

    if (location == "") {
        data.push(game_regions);
    }
    else if (location != "") {
        let striped_location = location.toUpperCase().split(" ").join("").split(",");
        if (striped_location.every(key => game_regions.includes(key))) {
            data.push(striped_location);
        }
    }
    else {
        console.error("[ERROR]: Unknown regions selected! Check set game.");
    }

    return data;
}

function player_check(server_data, set_data) {
    const sign = set_data[1][0];
    const num = parseInt(set_data[1][1]);

    if (num == 0) {
        console.error("[ERROR]: Number of players cannot be zero!");
    }

    let players = [];
    for (let i = 1; i < server_data.length; i++) {
        x = server_data[i].split(",");
        players.push(parseInt(x[2]));
    }

    let check = [];

    for (let i=0; i<players.length; i++) {
        if (players[i] == 0) {
            check.push(0);
            continue;
        }
        else if (sign && players[i] >= num) {
            check.push(1);
        }
        else if (!sign && players[i] <= num) {
            check.push(1);
        }
        else {
            check.push(0);
        }
    }

    return check;
}

function mode_check(server_data, set_data) {
    const wanted = set_data[2];

    if (wanted == "all") {
        return true;
    }

    let modes = [];
    for (let i=1; i<server_data.length; i++) {
        x = server_data[i].split(",");
        modes.push(parseInt(x[1]));
    }

    let check = [];

    for (let i=0; i<modes.length; i++) {
        if (wanted.includes(modes[i]))
            check.push(1);
        else {
            check.push(0);
        }
    }

    return check
}

function map_check(server_data, set_data) {
    const wanted = set_data[3];

    if (wanted == "all") {
        return true;
    }

    let maps = [];
    for (let i=1; i<server_data.length; i++) {
        x = server_data[i].split(",");
        maps.push(parseInt(x[3]));
    }

    let check = [];
    for (let i=0; i<maps.length; i++) {
        if (wanted.includes(maps[i])) {
            check.push(1);
        }
        else {
            check.push(0);
        }
    }
    return check;
}

function outputLine(server_data, index, location) {
    const data = server_data[index+1].split(",");
    let player = parseInt(data[2]);
    let mode = parseInt(data[1]);
    let map = parseInt(data[3]);

    for (let i in Modes) {
        if (mode == Modes[i]) {
            for (let l in Modes_long) {
                if (i == Modes_long[l]) {
                    mode = l.toUpperCase();
                    break;
                }
            }
        }
        else {
            continue;
        }
    }

    for (let j in Maps) {
        if (map == Maps[j]) {
            for (let k in Maps_long)
                if (j == Maps_long[k]) {
                    map = k.toUpperCase();
                    break;
                }
        }
        else {
            continue;
        }
    }

    return `<li>${location} : ${mode} : ${map} : ${player} / 16 players</li>`
}

function game_check(server_data, set_data, region) {
    let check = 0;
    let str_output = "";

    player = player_check(server_data, set_data)
    mode = mode_check(server_data, set_data)
    map = map_check(server_data, set_data)

    if (mode == true) {
        mode = new Array(player.length).fill(1);
    }
    if (map == true) {
        map = new Array(player.length).fill(1);
    }

    for (let j=0; j<player.length; j++) {
        if (player[j] && mode[j] && map[j]) {
            str_output += outputLine(server_data, j, region);
            check += 1;
        }
        else {
            continue
        }
    }
    return [check, str_output];
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function wb_mapper(id, status, button) {
(async () => {
    try {
        vars["stop"] = false;

        while (true) {

            if (vars["stop"]) {
                document.getElementById(status).innerHTML = "STOPPED";
                document.getElementById(button).disabled = false;
                console.log("Stopped.");
                return;
            }

            // Re-read settings each loop iteration for real-time updates
            let settings = set_data(vars["game"], vars["players"], vars["mode"], vars["map"], vars["location"]);

            let check = 0;
            let str_output = "<ul>";

            for (let i=0; i<settings[4].length; i++) {
                const server_data = await fetch_server_data(settings[4][i]);
                const wb_map = game_check(server_data, settings, settings[4][i]);

                if (server_data == []) {
                    document.getElementById(status).innerHTML = "ERROR — please contact the developer";
                    break;
                }

                check += wb_map[0];
                str_output += wb_map[1];
            }

            str_output += "</ul><div class='match-summary'>— Found " + check + " match" + (check == 1 ? "." : "es.") + "</div>";

            document.getElementById(id).innerHTML = str_output;

            if (check) {
                document.getElementById(status).innerHTML = "MATCH FOUND";

                document.getElementById(button).value = "start";
                document.getElementById(button).querySelector('.btn-text').textContent = "\u25B6 INITIATE SCAN";
                document.getElementById(button).disabled = false;

                if (document.hidden) {
                    document.title = "(1) War Brokers Server Mapper";
                }

                if (vars["playalert"]) {
                    let audio = new Audio('sounds/alert.mp3');
                    audio.play();
                }

                return;
            }

            document.getElementById(status).innerHTML = "SCANNING...";

            // Wait 30 seconds — DO NOT CHANGE THE 60, OR YOUR BROWSER WILL CRASH
            for (let i=0; i<60; i++) {
                await delay(500)
                if (vars["stop"]) {
                    document.getElementById(status).innerHTML = "STOPPED";
                    document.getElementById(button).disabled = false;
                    console.log("Stopped.");
                    return;
                }
            }
        }
    } catch (error) {
        console.error('Error in fetchData:', error);
    }
})();
}

// Hide idle on scan start
document.getElementById('startstop').addEventListener('click', function() {
    const idle = document.getElementById('output-idle');
    if (idle) idle.style.display = 'none';
});
import { $id } from "../helper.js";

let params;
let url;
let urlString;
const find_gas_station_main = $id("find-gas-station-main")
const find_gas_station_bottom = $id("find-gas-station-bottom")

document.addEventListener("DOMContentLoaded",getUrlParams)
$id("radius-input").addEventListener("change",updateRadiusUrlParam)
$id("gas-type").addEventListener("change",updateGasTypeUrlParam)


function getUrlParams(){
    urlString = find_gas_station_main.getAttribute("href")
    url = new URL(urlString)
    params = url.searchParams;
}

function updateRadiusUrlParam(){
    params.set('radius',this.value)
    updatedUrl()
}

function updateGasTypeUrlParam(){
    params.set('gas_type',this.value)
    updatedUrl()
}

function updatedUrl(){
    urlString = url.toString();
    find_gas_station_main.setAttribute("href",urlString)
    find_gas_station_bottom.setAttribute("href",urlString)
}


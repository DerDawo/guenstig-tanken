import {capitalize, debounce, $id, $class} from "./helper.js";
import {showSnackbar} from "./components.js"

// Constants
// Initialize the map and set its view to Berlin Main Station
const map = L.map('map').setView([52.5200, 13.4050], 13);

// DOM-Elements
const current_location_button = $id("current-location-button");
const search_location_button = $id("search-location-button");
const location_input = $id('pac-input');
const gas_type_input = $id('gas-type');
const radius_input = $id('radius-input');
const reset_filters_button = $id('reset-button');

// Variables
let lastSearchMarker;
let searchMarkers = [];
let gasStations = [];

// Functions
// Locate the user's current position
function locateUser() { 
    map.locate({ setView: true, maxZoom: 13 }) 
}

// Un-Highlight the Current Location Button
function unhighlightCurrentLocationFound(){ 
    current_location_button.classList.remove("location-found") 
}

// Highlight the Current Location Button
function highlightCurrentLocationFound(){ 
    current_location_button.classList.add("location-found") 
}

// Search current location using Nominatim API
function searchLocation() {
    if ( !location_input.value ){
        showSnackbar("Bitte geben Sie eine Adresse ein.", 5000)
        return
    }

    unhighlightCurrentLocationFound()

    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${location_input.value}`)
        .then(response => response.json())
        .then(data => {

            if (!data || data.length === 0) {
                showSnackbar("Die Adresse konnte nicht gefunden werden.", 5000)
                return 
            }

            var latlng = [data[0].lat, data[0].lon];
            var popup_adress = data[0].display_name;

            locationFound(latlng, popup_adress)
        })
        .catch(error => {
            showSnackbar("Es trat ein Fehler beim Suchen der Adresse auf.", 5000)
            console.error('Error:', error);
        });

}

function locationFound(latitude_longitude, popup_adress){
    map.setView(latitude_longitude, 13);

    // Remove the last search marker if it exists
    if (lastSearchMarker) {
        map.removeLayer(lastSearchMarker);
    }

    // Add a new marker for the searched location
    lastSearchMarker = L.marker(latitude_longitude, { icon: LocationIcon() })
        .addTo(map)
        .bindPopup(popup_adress)
        .openPopup();

    // Search Gas Station
    searchGasStations();
}

function addGasStationMarker(station){
    var marker = L.marker([station.lat, station.lng], { icon: GasStationIcon() })
        .addTo(map)
        .bindPopup(`${capitalize(gas_type_input.value)}: ${station.price}€<br>${station.name}<br>${station.postCode} ${capitalize(station.place)}<br>${capitalize(station.street)} ${station.houseNumber}`);
    searchMarkers.push(marker);
}

function addGasStationListItem(station){
    
}

// Search the gas stations
function searchGasStations() {
    
    var radius = radius_input.value || 25;

    if ( !lastSearchMarker || !radius || !gas_type_input.value ){
        showSnackbar("Bitte geben Sie eine Adresse, einen Treibstoff und den Suchradius ein.", 5000)
        return
    }

    var latlng = lastSearchMarker.getLatLng();

    fetch(`https://creativecommons.tankerkoenig.de/json/list.php?lat=${latlng.lat}&lng=${latlng.lng}&rad=${radius}&sort=dist&type=${gas_type_input.value}&apikey=6364803c-c10f-2f91-6b61-b4bda5cdfe4c`)
        .then(response => response.json())
        .then(data => {
            
            // Remove existing gas station markers
            searchMarkers.forEach(marker => map.removeLayer(marker));
            searchMarkers = [];

            if (!data || data.length === 0) {
                showSnackbar("Keine Tankstelle(n) gefunden.", 5000)
                return
            }

            gasStations = data.stations

            data.stations.forEach(station => { 
                addGasStationMarker(station)
                addGasStationListItem(station)
            });
            showSnackbar(`Es wurden ${data.stations.length} Tankstelle(n) gefunden.`, 5000)

        })
        .catch(error => {
            console.error('Error:', error);
            showSnackbar("Es trat ein Fehler beim Suchen von Tankstellen auf.", 5000)
        });
}

// Debounce searchGasStations
function DebouncedSearchGasStations(){
    debounce(searchGasStations, 1000)
}

// Location icon
function LocationIcon() {
    return L.icon({
        iconUrl: './location.png',
        shadowUrl: './shadowLocation.png',
        iconSize:     [32, 32],
        shadowSize:   [32, 32],
        iconAnchor:   [16, 16],
        shadowAnchor: [16, 16],
        popupAnchor:  [0, -16]
    });
}

// Gast Station Icon
function GasStationIcon() {
    return L.icon({
        iconUrl: './marker.png',
        shadowUrl: './shadow.png',
        iconSize:     [32, 32],
        shadowSize:   [32, 32],
        iconAnchor:   [0, 32],
        shadowAnchor: [4, 32],
        popupAnchor:  [16, -32]
    });
}

// Reset filters to default values
function resetFilters() {
    gas_type_input.value = 'diesel';
    radius_input.value = 25;
    searchGasStation()
}

// Events
// Success when the user's position found
map.on('locationfound', function (e) {
    var radius = e.accuracy / 2;

    highlightCurrentLocationFound()

    // Reverse geocoding to get the address
    fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${e.latlng.lat}&lon=${e.latlng.lng}`)
        .then(response => response.json())
        .then(data => {
            location_input.value = data.display_name

            var latlng = e.latlng
            var popup_adress = data.display_name

            locationFound(latlng, data.display_name)
        })
        .catch(error => {
            showSnackbar('Es trat ein Fehler beim Suchen Ihres Standorts auf.',5000)
            console.error(error);
        });
});

// Error in locating the user's position
map.on('locationerror', function (e) {
    showSnackbar('Es trat ein Fehler beim Suchen Ihres Standorts auf.',5000)
    console.error(e.message);
});

// EventListeners
search_location_button.addEventListener('click', searchLocation);
current_location_button.addEventListener('click', locateUser);
gas_type_input.addEventListener('change', DebouncedSearchGasStations);
radius_input.addEventListener('input', DebouncedSearchGasStations);
document.getElementById('reset-button').addEventListener('click', resetFilters);

// Init App
// Add a tile layer to the map (this one is free from OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: ''
}).addTo(map);

// Add a marker at the Berlin Main Station
L.marker([52.5200, 13.4050], { icon: LocationIcon() })
    .addTo(map)
    .bindPopup('Berlin')
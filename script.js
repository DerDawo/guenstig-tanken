import { capitalize, $id, $class, superscriptLastElement, debounce } from "./helper.js";
import { showSnackbar } from "./components.js"

// Constants
// Initialize the map and set its view to Berlin Main Station
const map = L.map('map').setView([52.5200, 13.4050], 13);

// DOM-Elements
const current_location_button = $id("current-location-button");
const search_location_button = $id("search-location-button");
const location_input = $id('pac-input');
const location_suggestions_div = $id('location-suggestions');
const gas_type_input = $id('gas-type');
const radius_input = $id('radius-input');
const reset_filters_button = $id('reset-button');
const sorting_slider = $id('sorting');
const toggle_map_focus_button = $id('toggle-map-focus')
const toggle_list_focus_button = $id('toggle-list-focus')


// Variables
// Add a marker at the Berlin Main Station
let lastSearchMarker = L.marker([52.5200, 13.4050], { icon: LocationIcon() })
    .addTo(map)
    .bindPopup('Berlin');
let searchMarkers = [];
let gasStations = [];
let sortingOption = sorting_slider.value

// Functions
// Locate the user's current position
function locateUser() {
    unhighlightCurrentLocationFound()
    addLoadingStatusCurrentLocationButton()
    map.locate({ setView: true, maxZoom: 13 })
}

function addLoadingStatusCurrentLocationButton(){
    current_location_button.classList.add("loading")
}

function removeLoadingStatusCurrentLocationButton(){
    current_location_button.classList.remove("loading")
}

// Un-Highlight the Current Location Button
function unhighlightCurrentLocationFound() {
    current_location_button.classList.remove("location-found")
}

// Highlight the Current Location Button
function highlightCurrentLocationFound() {
    current_location_button.classList.add("location-found")
}

function showLocationSuggestionsContainer() {
    statusMessageLocalSuggestionsContainer('Bitte geben Sie eine Adresse zum Suchen ein.')
    location_suggestions_div.style.display = "block";
}

function hideLocationSuggestionsContainer() {
    location_suggestions_div.style.display = "none";
}

function createSuggestionItem(content){
    const suggestionItem = document.createElement('div');
    suggestionItem.textContent = content;
    suggestionItem.className = 'suggestion-item';
    return suggestionItem
}

function addLocationSuggestionsItem(place) {
    const suggestionItem = createSuggestionItem(place.display_name);

    suggestionItem.addEventListener('click', () => {
        location_input.value = place.display_name;
        location_suggestions_div.innerHTML = '';
        hideLocationSuggestionsContainer()
    });

    location_suggestions_div.appendChild(suggestionItem);
}

function fillLocationSuggestionsContainer(places) {
    places.forEach(place => addLocationSuggestionsItem(place));
}

function emptyLocationSuggestionsContainer() {
    location_suggestions_div.innerHTML = '';
}

function statusMessageLocalSuggestionsContainer(message) {
    emptyLocationSuggestionsContainer()

    const suggestionItem = createSuggestionItem(message)

    location_suggestions_div.appendChild(suggestionItem);
}

function getLocationSuggestions() {
    const query = location_input.value;

    if (!query) {
        return;
    }

    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&addressdetails=1&limit=5`)
        .then(response => response.json())
        .then(data => {
            emptyLocationSuggestionsContainer()

            if (data.length === 0) {
                statusMessageLocalSuggestionsContainer('Es wurden keine Ergebnisse gefunden.')
                return;
            }

            fillLocationSuggestionsContainer(data)
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

// Search current location using Nominatim API
function searchLocation() {
    if (!location_input.value) {
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

function locationFound(latitude_longitude, popup_adress) {
    map.panTo(latitude_longitude, radius_input.value);

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

function addGasStationMarker(station) {
    var marker = L.marker([station.lat, station.lng], { icon: GasStationIcon() })
        .addTo(map)
        .bindPopup(`${capitalize(gas_type_input.value)}: ${station.price}€<br>${station.name}<br>${station.postCode} ${capitalize(station.place)}<br>${capitalize(station.street)} ${station.houseNumber}`);
    searchMarkers.push(marker);
}

function addAllGasStationMarkers() {
    gasStations.forEach(station => {
        addGasStationMarker(station)
    });
}

function emptyGasStationList() {
    $id("results").innerHTML = ``
}

function fillGasStationList() {
    emptyGasStationList()
    gasStations.forEach(station => addGasStationListItem(station))
}

function addGasStationListItem(station) {
    const listItem = `
        <div class="gasStationListItem" id="${station.id}" data-open="${station.isOpen}" data-distance="${station.dist}" data-price="${station.price}">
            <div class="gasStationGeneral">
                <div>
                <p class="brand" >${station.brand}</p>
                <p class="dist" >${station.dist}km</p>
                </div>
                <div>
                    <p class="postCode" >${station.postCode}</p>
                    <p class="place" >${capitalize(station.place.toLowerCase())}</p>
                </div>
                <div>
                    <p class="street" >${capitalize(station.street.toLowerCase())}</p>
                    <p class="houseNumber" >${station.houseNumber}</p>
                </div>
            </div>
            <div class="gasStationPrice">
                <p class="price" >${superscriptLastElement(station.price)}</p>
                <p class="gasType" >${capitalize(gas_type_input.value)}</p>
            </div>
        </div>
    `
    $id("results").innerHTML += listItem
}

function sortGasStationList() {
    if (sortingOption === "Price") {
        sortGasStationListByPrice()
    }
    if (sortingOption === "Distance") {
        sortGasStationListByDistance()
    }
}

function toggleGasStationListSorting(event) {
    sortingOption = event.target.value;
    sortGasStationList()
    fillGasStationList()
}

function sortGasStationListByPrice() {
    gasStations.sort(function (a, b) {
        if (a.isOpen !== b.isOpen) {
            return a.isOpen ? -1 : 1; // isOpen: true comes before isOpen: false
        }
        return a.price - b.price
    })
}

function sortGasStationListByDistance() {
    gasStations.sort(function (a, b) {
        if (a.isOpen !== b.isOpen) {
            return a.isOpen ? -1 : 1; // isOpen: true comes before isOpen: false
        }
        return a.dist - b.dist
    })
}

// Search the gas stations
function searchGasStations() {

    const radius = radius_input.value || 25;

    if (!lastSearchMarker || !radius || !gas_type_input.value) {
        showSnackbar("Bitte geben Sie eine Adresse, einen Treibstoff und den Suchradius ein.", 5000)
        return
    }

    const latlng = lastSearchMarker.getLatLng();

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
            console.log(gasStations)

            addAllGasStationMarkers()
            sortGasStationList()
            fillGasStationList()

            showSnackbar(`Es wurden ${data.stations.length} Tankstelle(n) gefunden.`, 5000)

        })
        .catch(error => {
            console.error('Error:', error);
            showSnackbar("Es trat ein Fehler beim Suchen von Tankstellen auf.", 5000)
        });
}

// Location icon
function LocationIcon() {
    return L.icon({
        iconUrl: './location.png',
        shadowUrl: './shadowLocation.png',
        iconSize: [32, 32],
        shadowSize: [32, 32],
        iconAnchor: [16, 16],
        shadowAnchor: [16, 16],
        popupAnchor: [0, -16]
    });
}

// Gast Station Icon
function GasStationIcon() {
    return L.icon({
        iconUrl: './marker.png',
        shadowUrl: './shadow.png',
        iconSize: [32, 32],
        shadowSize: [32, 32],
        iconAnchor: [0, 32],
        shadowAnchor: [4, 32],
        popupAnchor: [16, -32]
    });
}

// Reset filters to default values
function resetFilters() {
    gas_type_input.value = 'diesel';
    radius_input.value = 25;
    searchGasStation()
}


function toggleListFocus() {
    if (this.checked) {
        maximizeList()
    }
    if (!this.checked) {
        minimizeList()
    }
}

function toggleMapFocus() {
    if (this.checked) {
        maximizeMap()
    }
    if (!this.checked) {
        minimizeMap()
    }
}

function maximizeList() {
    if (document.body.classList.contains('focus-map')) {
        minimizeMap()
    }
    document.body.classList.add("focus-list")
}

function minimizeList() {
    document.body.classList.remove("focus-list")
}

function maximizeMap() {
    if (document.body.classList.contains('focus-list')) {
        minimizeList()
    }
    document.body.classList.add("focus-map")
}

function minimizeMap() {
    document.body.classList.remove("focus-map")
}



// Events
// Success when the user's position found
map.on('locationfound', function (e) {

    removeLoadingStatusCurrentLocationButton()
    highlightCurrentLocationFound()

    // Reverse geocoding to get the address
    fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${e.latlng.lat}&lon=${e.latlng.lng}`)
        .then(response => response.json())
        .then(data => {
            location_input.value = data.display_name

            var latlng = e.latlng

            locationFound(latlng, data.display_name)
        })
        .catch(error => {
            showSnackbar('Es trat ein Fehler beim Suchen Ihres Standorts auf.', 5000)
            console.error(error);
        });
});

// Error in locating the user's position
map.on('locationerror', function (e) {
    showSnackbar('Es trat ein Fehler beim Suchen Ihres Standorts auf.', 5000)
    console.error(e.message);
});

// EventListeners
search_location_button.addEventListener('click', searchLocation);
current_location_button.addEventListener('click', locateUser);
gas_type_input.addEventListener('change', searchGasStations);
radius_input.addEventListener('input', searchGasStations);
reset_filters_button.addEventListener('click', resetFilters);
sorting_slider.addEventListener('toggle', toggleGasStationListSorting)
toggle_map_focus_button.addEventListener('change', toggleMapFocus)
toggle_list_focus_button.addEventListener('change', toggleListFocus)
location_input.addEventListener('click',showLocationSuggestionsContainer)
location_input.addEventListener('input',getLocationSuggestions)

// Init App
// Add a tile layer to the map (this one is free from OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: ''
}).addTo(map);


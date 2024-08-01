import { capitalize, $id, $class, superscriptLastElement, debounce, addLeadingZero } from "./helper.js";
import { showSnackbar } from "./components.js"
import { API_KEY } from "./env.js";

// Constants
// Initialize the map and set its view to Berlin Main Station
const latlngBerlin = [52.5200, 13.4050]
const map = L.map('map').setView(latlngBerlin, 13);
const price_update_interval = 1000 * 60 * 15;

// DOM-Elements
const current_location_button = $id("current-location-button");
const search_location_button = $id("search-location-button");
const location_input = $id('pac-input');
const location_suggestions_div = $id('location-suggestions');
const gas_type_input = $id('gas-type');
const radius_input = $id('radius-input');
const sorting_slider = $id('sorting');
const delete_location_input = $id('delete-location-input');
const list_slider = $id("list-slider");
const list_slider_knob = $id("list-slider-knob");
const list_slider_search = $id("list-slider-search");
const app_bar = $id("app-bar")

// SnapPoints In The Window
const list_top_end = window.innerHeight - app_bar.style.height - 55;
const list_mid_end = Math.round(list_top_end * .5);
const list_btm_end = 65;
const top_mid_breakpoint = Math.round((list_top_end + list_mid_end) * .5);
const mid_btm_breakpoint = Math.round((list_btm_end + list_mid_end) * .5);

// Variables
let lastSearchMarker;
let searchMarkers = [];
let gasStations = [];
let sortingOption = sorting_slider.value;
let isResizingList = false;
let previousYList = 0;
let urlParams = [];

// Functions
// Clear the location input and hide suggestions
function deleteAndCloseLocationInput() {
    location_input.value = ''
    hideLocationSuggestionsContainer()
}

// Locate the user's current position
function locateUser() {
    unhighlightCurrentLocationFound()
    addLoadingStatusCurrentLocationButton()
    map.locate({ setView: true, maxZoom: 13 })
}

function addLoadingStatusCurrentLocationButton() {
    current_location_button.classList.add("loading")
}

function removeLoadingStatusCurrentLocationButton() {
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

function createSuggestionItem(content) {
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

    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&addressdetails=1&limit=5&countrycodes=de`)
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

function DebouncedGetLocalSuggestions(){
    console.log(debounce)
    debounce(getLocationSuggestions,1000)
}


// Search current location using Nominatim API
function searchLocation() {
    if (!location_input.value) {
        showSnackbar("Bitte geben Sie eine Adresse ein.")
        return
    }

    unhighlightCurrentLocationFound()

    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${location_input.value}`)
        .then(response => response.json())
        .then(data => {

            if (!data || data.length === 0) {
                showSnackbar("Die Adresse konnte nicht gefunden werden.")
                return
            }

            var latlng = [data[0].lat, data[0].lon];
            var popup_adress = data[0].display_name;

            locationFound(latlng, popup_adress, LocationIcon)
        })
        .catch(error => {
            showSnackbar("Es trat ein Fehler beim Suchen der Adresse auf.")
            console.error('Error:', error);
        });

}

function locationFound(latitude_longitude, popup_adress, icon) {
    map.panTo(latitude_longitude, radius_input.value);

    // Remove the last search marker if it exists
    if (lastSearchMarker) {
        map.removeLayer(lastSearchMarker);
    }

    // Add a new marker for the searched location
    lastSearchMarker = L.marker(latitude_longitude, { icon: icon() })
        .addTo(map)

    // Search Gas Station
    searchGasStations(gasStationsFoundCallback);
}

function addGasStationMarker(station) {

    const icon = station.isOpen === true ? GasStationIcon : GasStationIconClosed

    var marker = L.marker([station.lat, station.lng], { icon: icon() })
        .addTo(map)
        .bindPopup(`
            <span class="popup-price">${capitalize(gas_type_input.value)}: ${station.price} €</span><br>
            <br>
            <span class="popup-brand">${station.brand}</span><br>
            ${addLeadingZero(station.postCode)} ${capitalize(station.place)}<br>
            ${capitalize(station.street)} ${station.houseNumber}<br>
            <br>
            <a href="geo:${station.lat},${station.lng}" target="_blank">Route</a>
        `);
    searchMarkers.push(
        {
            marker: marker,
            id: station.id
        }
    )
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
    let counter = 0;
    for(const station of gasStations){
        counter += 1
        addGasStationListItem(station)
        if(counter === 3 || ((counter - 3) % 5 === 0)){
            addAdListItem(counter)
        }
    }
}

function addGasStationListItem(station) {
    const listItem = `
        <div class="gasStationListItem" id="${station.id}" data-open="${station.isOpen}" data-distance="${station.dist}" data-price="${station.price}">
            <div class="gasStationGeneral">
                <div>
                <p class="brand" >${station.brand}</p>
                <p class="isOpen" >${station.isOpen === true ? "Geöffnet" : ""}</p>
                <p class="dist" >${station.dist}km</p>
                </div>
                <div>
                    <p class="postCode" >${addLeadingZero(station.postCode)}</p>
                    <p class="place" >${capitalize(station.place)}</p>
                </div>
                <div>
                    <p class="street" >${capitalize(station.street)}</p>
                    <p class="houseNumber" >${station.houseNumber}</p>
                </div>
            </div>
            <div class="gasStationPrice">
                <p class="price" >${station.isOpen === true ? superscriptLastElement(station.price) : superscriptLastElement("8.888")}</p>
                <p class="gasType" ></p>
            </div>
        </div>
    `
    $id("results").insertAdjacentHTML('beforeend', listItem);
    // focus gasStation
    $id(station.id).addEventListener('click', () => {
        const result = searchMarkers.filter(marker => {
            return marker.id === station.id
        })
        result[0].marker.fire('click');
    })
}

function addAdListItem(counter){
    const listItem = `
    <div class="gasStationListItem adListItem" data-priority="${counter === 3 ? 1 : 2}">
        <a href="mailto:voll-tank@gmail.com">
            <p>Hier könnte Ihre Werbung stehen!</p>
        </a>
    </div>
`
$id("results").insertAdjacentHTML('beforeend', listItem);
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
function searchGasStations(successCallback = null) {

    const radius = radius_input.value;

    if (!lastSearchMarker || !radius || !gas_type_input.value) {
        showSnackbar("Bitte geben Sie eine Adresse, einen Treibstoff und den Suchradius ein.")
        return
    }

    const latlng = lastSearchMarker.getLatLng();

    fetch(`https://creativecommons.tankerkoenig.de/json/list.php?lat=${latlng.lat}&lng=${latlng.lng}&rad=${radius}&sort=dist&type=${gas_type_input.value}&apikey=${API_KEY}`)
        .then(response => response.json())
        .then(data => {

            // Remove existing gas station markers
            searchMarkers.forEach(marker => map.removeLayer(marker.marker));
            searchMarkers = [];

            if (!data || data.length === 0) {
                showSnackbar("Keine Tankstelle(n) gefunden.")
                return
            }

            gasStations = data.stations

            addAllGasStationMarkers()
            sortGasStationList()
            fillGasStationList()

            if (successCallback !== null) {
                successCallback()
            }


        })
        .catch(error => {
            console.error('Error:', error);
            showSnackbar("Es trat ein Fehler beim Suchen von Tankstellen auf.")
        });
}

function gasStationsFoundCallback() {
    if (gasStations.length === 1) {
        showSnackbar(`Es wurde ${gasStations.length} Tankstelle gefunden.`)
        return
    }
    showSnackbar(`Es wurden ${gasStations.length} Tankstellen gefunden.`)
}

function gasStationsPricesUpdatedCallback() {
    showSnackbar(`Preise wurden aktualisiert.`)
}

function updateGasStationPrices() {
    setInterval(updateGasStationPricesWrapper, price_update_interval)
}

function updateGasStationPricesWrapper() {
    searchGasStations(gasStationsPricesUpdatedCallback)
}

function UserLocationIcon() {
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

function LocationIcon() {
    return L.icon({
        iconUrl: './marker.png',
        shadowUrl: './shadowLocation.png',
        iconSize: [32, 32],
        shadowSize: [32, 32],
        iconAnchor: [16, 16],
        shadowAnchor: [16, 16],
        popupAnchor: [0, -16]
    });
}

function GasStationIcon() {
    return L.icon({
        iconUrl: './gas_marker.png',
        shadowUrl: './shadow.png',
        iconSize: [32, 32],
        shadowSize: [32, 32],
        iconAnchor: [0, 32],
        shadowAnchor: [4, 32],
        popupAnchor: [16, -32]
    });
}

function GasStationIconClosed() {
    return L.icon({
        iconUrl: './gas_marker_closed.png',
        shadowUrl: './shadow.png',
        iconSize: [32, 32],
        shadowSize: [32, 32],
        iconAnchor: [0, 32],
        shadowAnchor: [4, 32],
        popupAnchor: [16, -32]
    });
}

function snapListToPoints() {
    isResizingList = false;

    const computedHeight = list_slider.clientHeight;

    let newHeight = 0;

    if (computedHeight >= top_mid_breakpoint) {
        location_suggestions_div.classList.add("snap-top")
        location_suggestions_div.classList.remove("snap-mid")
        location_suggestions_div.classList.remove("snap-btm")
        newHeight = list_top_end
    } else if (computedHeight < top_mid_breakpoint && computedHeight >= mid_btm_breakpoint) {
        location_suggestions_div.classList.add("snap-mid")
        location_suggestions_div.classList.remove("snap-top")
        location_suggestions_div.classList.remove("snap-btm")
        newHeight = list_mid_end
    } else {
        location_suggestions_div.classList.add("snap-btm")
        location_suggestions_div.classList.remove("snap-mid")
        location_suggestions_div.classList.remove("snap-top")
        newHeight = list_btm_end
    }

    list_slider.style.height = `${newHeight}px`;
    document.body.style.gridTemplateRows = `var(--app-bar-height) auto ${newHeight}px`;
}

function getUrlParams() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    return urlParams
}

function basicInit() {
    try {
        locateUser()
    } catch (error) {
        removeLoadingStatusCurrentLocationButton()
        console.log(error)
        lastSearchMarker = L.marker(latlngBerlin, { icon: LocationIcon() })
            .addTo(map)
    }
}

function initByParams() {
    let latlng = [urlParams.get("lat"), urlParams.get("lng")]

    if (urlParams.get("gas_type") !== null) {
        gas_type_input.value = urlParams.get("gas_type")
    }
    if (urlParams.get("radius") !== null) {
        radius_input.value = urlParams.get("radius")
    }

    locationFound(latlng, "", LocationIcon)
}

function errorInLocalizationSnackbar() {
    showSnackbar('Es trat ein Fehler beim Suchen Ihres Standorts auf.')
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

            locationFound(latlng, data.display_name, UserLocationIcon)
        })
        .catch(error => {
            errorInLocalizationSnackbar()
            console.error(error);
        });
});

// Error in locating the user's position
map.on('locationerror', function (e) {
    removeLoadingStatusCurrentLocationButton()
    errorInLocalizationSnackbar()
    console.error(e.message);
});




// EventListeners
search_location_button.addEventListener('click', searchLocation);
current_location_button.addEventListener('click', locateUser);
gas_type_input.addEventListener('change', () => searchGasStations(gasStationsFoundCallback));
radius_input.addEventListener('input', () => searchGasStations(gasStationsFoundCallback));
sorting_slider.addEventListener('toggle', toggleGasStationListSorting)
location_input.addEventListener('click', showLocationSuggestionsContainer)
location_input.addEventListener('input', getLocationSuggestions)
location_input.addEventListener('keydown', (evt) => {
    evt = evt || window.event;
    if (evt.keyCode == 27) { hideLocationSuggestionsContainer() }
})
delete_location_input.addEventListener('click', deleteAndCloseLocationInput)

if (!window.matchMedia("(orientation: landscape)").matches) {
    list_slider_search.addEventListener('touchstart', (e) => {
        isResizingList = true;
        previousYList = e.touches[0].clientY; // Use e.touches for touch events
    });
    list_slider_knob.addEventListener('touchstart', (e) => {
        e.preventDefault(); // Prevent default touch behavior if needed
        isResizingList = true;
        previousYList = e.touches[0].clientY; // Use e.touches for touch events
    });
    document.addEventListener('touchmove', (e) => {
        e.preventDefault(); // Prevent default touch behavior if needed
        if (!isResizingList) return;
    
        const delta = e.touches[0].clientY - previousYList;
        const computedHeight = list_slider.clientHeight - delta;
    
        list_slider.style.height = `${computedHeight}px`;
        document.body.style.gridTemplateRows = `var(--app-bar-height) auto ${computedHeight}px`;
    
        previousYList = e.touches[0].clientY; // Use e.touches for touch events
    });
    document.addEventListener('touchend', snapListToPoints);
}

document.addEventListener("DOMContentLoaded", init)

// Init App
function init() {

    // Add a tile layer to the map (this one is free from OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: ''
    }).addTo(map);

    urlParams = getUrlParams()

    if (urlParams.size === 0) {
        basicInit()
    } else {
        initByParams()
    }

    snapListToPoints()
    setTimeout(updateGasStationPrices, price_update_interval)

}
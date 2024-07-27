import { $id } from "../helper.js";

let params;
let url;
let urlString;
let lat, lng;

const find_gas_station_main = $id("find-gas-station-main")
const find_gas_station_bottom = $id("find-gas-station-bottom")
const current_location_button = $id("current-location-button");
const location_input = $id('pac-input');
const location_suggestions_div = $id('location-suggestions');
const delete_location_input = $id('delete-location-input');

function getUrlParams() {
    urlString = find_gas_station_main.getAttribute("href")
    url = new URL(urlString)
    params = url.searchParams;
}

function updateLatLngUrlParam() {
    params.set('lat', lat)
    params.set('lng', lng)
    updatedUrl()
}

function updateRadiusUrlParam() {
    params.set('radius', this.value)
    updatedUrl()
}

function updateGasTypeUrlParam() {
    params.set('gas_type', this.value)
    updatedUrl()
}

function updatedUrl() {
    urlString = url.toString();
    find_gas_station_main.setAttribute("href", urlString)
    find_gas_station_bottom.setAttribute("href", urlString)
}

function setLatLng(latitude = 0, longitude = 0) {
    lat = latitude;
    lng = longitude;
    updateLatLngUrlParam();
}

function deleteAndCloseLocationInput() {
    location_input.value = ''
    hideLocationSuggestionsContainer()
}

function locateUser() {
    unhighlightCurrentLocationFound()
    addLoadingStatusCurrentLocationButton()

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            removeLoadingStatusCurrentLocationButton()
            highlightCurrentLocationFound()
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            setLatLng(lat, lng)
            // Reverse geocoding to get the address
            fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`)
                .then(response => response.json())
                .then(data => {
                    location_input.value = data.display_name
                })
                .catch(error => {
                    showSnackbar('Es trat ein Fehler beim Suchen Ihres Standorts auf.')
                    console.error(error);
                });

        });
    } else {
        removeLoadingStatusCurrentLocationButton()
        highlightCurrentLocationFound()
        console.log("Geolocation is not supported by this browser.");
    }

}

function addLoadingStatusCurrentLocationButton() {
    current_location_button.classList.add("loading")
}

function removeLoadingStatusCurrentLocationButton() {
    current_location_button.classList.remove("loading")
}

function unhighlightCurrentLocationFound() {
    current_location_button.classList.remove("location-found")
}

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
        setLatLng(place.lat, place.lon)
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


location_input.addEventListener('click', showLocationSuggestionsContainer)
location_input.addEventListener('input', getLocationSuggestions)
location_input.addEventListener('keydown', (evt) => {
    evt = evt || window.event;
    if (evt.keyCode == 27) { hideLocationSuggestionsContainer() }
})
current_location_button.addEventListener('click', locateUser);
delete_location_input.addEventListener('click', deleteAndCloseLocationInput)
document.addEventListener("DOMContentLoaded", getUrlParams)
$id("radius-input").addEventListener("change", updateRadiusUrlParam)
$id("gas-type").addEventListener("change", updateGasTypeUrlParam)

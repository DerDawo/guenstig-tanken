export function debounce(func, wait) {
    let timeout;

    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            func(...args);
        };

        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

export function capitalize(s) {
    return s.toLowerCase()
            .split('-')
            .map(part => part[0].toUpperCase() + part.slice(1))
            .join('-')
            .split(' ')
            .map(part => part[0].toUpperCase() + part.slice(1))
            .join(' ');
}

export function superscriptLastElement(s){
    s = String(s)
    return `${s.slice(0, -1)}<span class="milli_cent">${s.slice(-1)}</span>`;
}

export function $id(id){
    return document.getElementById(id);
}

export function $class(id){
    return document.getElementsByClassname(id);
}

export function addLeadingZero(s) {
    let str = String(s)
    if (str.length === 4) {
        return '0' + str;
    }
    return str;
}

export function differenceInMinutes(timestamp1, timestamp2) {
    // Convert inputs to Date objects if they are not already
    const date1 = new Date(timestamp1);
    const date2 = new Date(timestamp2);

    // Ensure both dates are valid
    if (isNaN(date1.getTime()) || isNaN(date2.getTime())) {
        throw new Error("Invalid timestamp(s) provided.");
    }

    // Calculate the difference in milliseconds
    const differenceInMilliseconds = Math.abs(date2 - date1);

    // Convert milliseconds to minutes
    const differenceInMinutes = differenceInMilliseconds / (1000 * 60);

    return differenceInMinutes
}

/**
 * Calculates the distance between two geographical points using the Haversine formula.
 * 
 * @param {Array|Object} point1 - The first point. Can be an array [lat, lng] or an object { lat, lng }.
 * @param {Array|Object} point2 - The second point. Can be an array [lat, lng] or an object { lat, lng }.
 * @returns {number} - The distance between the two points in kilometers.
 */
export function haversineDistance(point1, point2) {
    // Radius of the Earth in kilometers
    const R = 6371;

    // Function to extract latitude and longitude
    const extractLatLng = (point) => {
        if (Array.isArray(point)) {
            return { lat: point[0], lng: point[1] };
        } else if (typeof point === 'object' && point.lat !== undefined && point.lng !== undefined) {
            return { lat: point.lat, lng: point.lng };
        } else {
            throw new Error("Invalid point format. Must be an array [lat, lng] or an object { lat, lng }.");
        }
    };

    // Extract latitudes and longitudes from inputs
    const { lat: lat1, lng: lon1 } = extractLatLng(point1);
    const { lat: lat2, lng: lon2 } = extractLatLng(point2);

    // Convert degrees to radians
    const toRadians = (degrees) => degrees * Math.PI / 180;

    // Convert coordinates from degrees to radians
    const lat1Rad = toRadians(lat1);
    const lon1Rad = toRadians(lon1);
    const lat2Rad = toRadians(lat2);
    const lon2Rad = toRadians(lon2);

    // Differences in coordinates
    const deltaLat = lat2Rad - lat1Rad;
    const deltaLon = lon2Rad - lon1Rad;

    // Haversine formula
    const a = Math.sin(deltaLat / 2) ** 2 +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(deltaLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    // Distance in kilometers
    const distance = R * c;

    return distance;
}

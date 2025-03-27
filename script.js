let map;
let useKilometers = true;
let savedLocations = [];

function initMap() {
    mapboxgl.accessToken = 'pk.eyJ1IjoibW9la2lub3RpIiwiYSI6ImNtOHJidXZ0MDB1N3oyaXF4MjQ4amZ1bTYifQ.yJSEvp1pcvHkocoa925yEA'; // From config.js
    map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/dark-v10',
        center: [36.817223, -1.286389], // [lng, lat]
        zoom: 8,
        pitch: 60, // 3D tilt angle (0-60 degrees)
        bearing: 0 // Optional: rotation angle
    });

    // Event listeners
    document.getElementById("search-button").addEventListener("click", () => {
        const locationInput = document.getElementById("location-input").value;
        if (locationInput) searchLocation(locationInput);
    });

    document.getElementById("voice-button").addEventListener("click", startVoiceRecognition);

    const helpButton = document.getElementById("help-button");
    const modal = document.getElementById("help-modal");
    const closeBtn = document.querySelector(".close");
    helpButton.addEventListener("click", () => modal.style.display = "block");
    closeBtn.addEventListener("click", () => modal.style.display = "none");
    window.addEventListener("click", (e) => {
        if (e.target === modal) modal.style.display = "none";
    });

    document.getElementById("unit-btn").addEventListener("click", () => {
        useKilometers = !useKilometers;
        document.getElementById("unit-btn").textContent = useKilometers ? "KM" : "MI";
    });

    document.getElementById("mode-toggle").addEventListener("click", () => {
        document.body.classList.toggle("light-mode");
        document.getElementById("mode-toggle").textContent = document.body.classList.contains("light-mode") ? "☀️" : "🌙";
    });

    map.on('click', (e) => {
        const latitude = e.lngLat.lat;
        const longitude = e.lngLat.lng;
        displayCoordinates(latitude, longitude);
        fetchLocationInsights(latitude, longitude);
    });

    document.getElementById("distance-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const point1Lat = parseFloat(document.getElementById("point1-lat").value);
        const point1Lng = parseFloat(document.getElementById("point1-lng").value);
        const point2Lat = parseFloat(document.getElementById("point2-lat").value);
        const point2Lng = parseFloat(document.getElementById("point2-lng").value);
        if (isNaN(point1Lat) || isNaN(point1Lng) || isNaN(point2Lat) || isNaN(point2Lng)) {
            alert("Please enter valid coordinates!");
            return;
        }
        const distance = calculateDistance(point1Lat, point1Lng, point2Lat, point2Lng);
        displayDistance(distance);
    });

    document.getElementById("save-location").addEventListener("click", () => {
        const lat = parseFloat(document.getElementById("latitude").textContent.split(": ")[1]);
        const lng = parseFloat(document.getElementById("longitude").textContent.split(": ")[1]);
        const name = document.getElementById("insight-location").textContent.split(": ")[1];
        saveLocation(lat, lng, name);
    });
}

function searchLocation(location) {
    fetch(`https://api.mapbox.com/search/geocode/v6/forward?q=${encodeURIComponent(location)}&proximity=ip&access_token=${MAPBOX_ACCESS_TOKEN}`)
        .then(response => response.json())
        .then(data => {
            if (data.features && data.features.length > 0) {
                const [longitude, latitude] = data.features[0].geometry.coordinates;
                map.setCenter([longitude, latitude]);
                map.setZoom(12);
                map.setPitch(45); // Maintain 3D tilt after search
                displayCoordinates(latitude, longitude);
                fetchLocationInsights(latitude, longitude);
            } else {
                alert("Location not found!");
            }
        })
        .catch(error => {
            console.error("Search error:", error);
            alert("Error searching location!");
        });
}

function displayCoordinates(latitude, longitude) {
    document.getElementById("latitude").textContent = `Latitude: ${latitude.toFixed(6)}`;
    document.getElementById("longitude").textContent = `Longitude: ${longitude.toFixed(6)}`;
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = useKilometers ? 6371 : 3959; // Earth radius in km or miles
    const dLat = rad(lat2 - lat1);
    const dLon = rad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(rad(lat1)) * Math.cos(rad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function displayDistance(distance) {
    const unit = useKilometers ? "km" : "mi";
    document.getElementById("distance-value").textContent = `Distance: ${distance.toFixed(2)} ${unit}`;
}

function rad(x) {
    return x * Math.PI / 180;
}

function fetchLocationInsights(lat, lng) {
    fetch(`https://api.mapbox.com/search/geocode/v6/reverse?longitude=${lng}&latitude=${lat}&access_token=${MAPBOX_ACCESS_TOKEN}`)
        .then(response => response.json())
        .then(data => {
            const locationName = data.features[0]?.properties?.full_address || "Unknown Location";
            document.getElementById("insight-location").textContent = `Location: ${locationName}`;
        });

    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${OPENWEATHER_API_KEY}&units=metric`)
        .then(response => response.json())
        .then(data => {
            const temp = data.main.temp;
            const desc = data.weather[0].description;
            document.getElementById("insight-weather").textContent = `Weather: ${temp}°C, ${desc}`;
        })
        .catch(() => {
            document.getElementById("insight-weather").textContent = "Weather: Unavailable";
        });
}

function saveLocation(lat, lng, name) {
    savedLocations.push({ lat, lng, name });
    updateSavedLocations();
}

function updateSavedLocations() {
    const list = document.getElementById("saved-list");
    list.innerHTML = "";
    savedLocations.forEach((loc, index) => {
        const li = document.createElement("li");
        li.textContent = `${loc.name} (${loc.lat.toFixed(2)}, ${loc.lng.toFixed(2)})`;
        li.addEventListener("click", () => {
            map.setCenter([loc.lng, loc.lat]);
            map.setZoom(12);
            map.setPitch(45); // Maintain 3D tilt when revisiting
            displayCoordinates(loc.lat, loc.lng);
            fetchLocationInsights(loc.lat, loc.lng);
        });
        list.appendChild(li);
    });
}

function startVoiceRecognition() {
    if (!('webkitSpeechRecognition' in window)) {
        alert("Voice recognition not supported in your browser!");
        return;
    }
    const recognition = new webkitSpeechRecognition();
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        document.getElementById("location-input").value = transcript;
        searchLocation(transcript);
    };
    recognition.onerror = () => alert("Voice recognition failed!");
    recognition.start();
}

document.addEventListener('DOMContentLoaded', initMap);
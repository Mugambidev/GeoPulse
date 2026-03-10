let map;
let useKilometers = true;
let savedLocations = [];
let measurePoints = [];
let userLoggedIn = false;
let darkMode = true;

// These will be populated by the Go backend
let MAPBOX_ACCESS_TOKEN = '';
let OPENWEATHER_API_KEY = '';

/**
 * 1. INITIALIZATION & CONFIG
 */

async function loadConfig() {
    try {
        const response = await fetch('/api/config');
        if (!response.ok) throw new Error("Failed to fetch config");
        
        const config = await response.json();
        
        MAPBOX_ACCESS_TOKEN = config.mapbox_token;
        OPENWEATHER_API_KEY = config.weather_key;
        
        // Only initialize the map once we have the token
        initMap(); 
    } catch (err) {
        console.error("Could not load config from Go backend:", err);
        showNotification("Security Error: Could not retrieve API keys.", "error");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadSavedLocations();
    loadConfig(); // The entry point is now loadConfig
    
    // Set initial UI state
    document.getElementById("unit-btn").textContent = useKilometers ? "KM" : "MI";
    document.querySelector("#mode-toggle i").className = darkMode ? "fas fa-moon" : "fas fa-sun";
});

function initMap() {
    if (!MAPBOX_ACCESS_TOKEN) return;

    mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;
    map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/dark-v10',
        center: [36.817223, -1.286389], // [lng, lat]
        zoom: 8,
        pitch: 60,
        bearing: 0
    });

    const loadingOverlay = document.getElementById("loading-overlay");
    loadingOverlay.style.display = "flex";

    map.on('load', () => {
        loadingOverlay.style.display = "none";
        setupMapEvents();
    });

    setupEventListeners();
}

/**
 * 2. EVENT LISTENERS
 */

function setupMapEvents() {
    map.on('click', (e) => {
        const latitude = e.lngLat.lat;
        const longitude = e.lngLat.lng;
        displayCoordinates(latitude, longitude);
        fetchLocationInsights(latitude, longitude);
        fetchElevation(latitude, longitude);
        
        if (measurePoints.length < 2) {
            measurePoints.push([latitude, longitude]);
            if (measurePoints.length === 2) {
                document.getElementById("point1-lat").value = measurePoints[0][0];
                document.getElementById("point1-lng").value = measurePoints[0][1];
                document.getElementById("point2-lat").value = measurePoints[1][0];
                document.getElementById("point2-lng").value = measurePoints[1][1];
                
                const distance = calculateDistance(
                    measurePoints[0][0], measurePoints[0][1],
                    measurePoints[1][0], measurePoints[1][1]
                );
                displayDistance(distance);
                measurePoints = [];
            }
        }
    });
}

function setupEventListeners() {
    document.getElementById("search-button").addEventListener("click", () => {
        const locationInput = document.getElementById("location-input").value;
        if (locationInput) searchLocation(locationInput);
    });
    
    document.getElementById("location-input").addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            const locationInput = document.getElementById("location-input").value;
            if (locationInput) searchLocation(locationInput);
        }
    });

    document.getElementById("voice-button").addEventListener("click", startVoiceRecognition);
    setupModal("help-button", "help-modal");
    setupModal("share-location", "share-modal");
    setupModal("user-account", "login-modal");
    setupModal("export-locations", "export-modal");

    document.getElementById("unit-btn").addEventListener("click", () => {
        useKilometers = !useKilometers;
        document.getElementById("unit-btn").textContent = useKilometers ? "KM" : "MI";
    });

    document.getElementById("mode-toggle").addEventListener("click", () => {
        darkMode = !darkMode;
        document.body.classList.toggle("light-mode");
        map.setStyle(darkMode ? 'mapbox://styles/mapbox/dark-v10' : 'mapbox://styles/mapbox/light-v10');
        document.querySelector("#mode-toggle i").className = darkMode ? "fas fa-moon" : "fas fa-sun";
    });

    document.getElementById("center-btn").addEventListener("click", centerOnUserLocation);
    document.getElementById("calculate-route").addEventListener("click", calculateRoute);
    
    // Save location
    document.getElementById("save-location").addEventListener("click", () => {
        const latText = document.getElementById("latitude").textContent.split(": ")[1];
        const lngText = document.getElementById("longitude").textContent.split(": ")[1];
        const name = document.getElementById("insight-location").textContent.split(": ")[1];
        
        const lat = parseFloat(latText);
        const lng = parseFloat(lngText);
        
        if (isNaN(lat) || isNaN(lng)) {
            showNotification("No location selected to save", "warning");
            return;
        }
        saveLocation(lat, lng, name);
    });

    checkUrlForLocation();
}

/**
 * 3. CORE API FUNCTIONS (Now using variables from Go)
 */

function searchLocation(location) {
    if (!MAPBOX_ACCESS_TOKEN) {
        showNotification("Waiting for API connection...", "warning");
        return;
    }

    const loadingOverlay = document.getElementById("loading-overlay");
    loadingOverlay.style.display = "flex";
    
    fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(location)}.json?access_token=${MAPBOX_ACCESS_TOKEN}`)
        .then(response => response.json())
        .then(data => {
            loadingOverlay.style.display = "none";
            if (data.features && data.features.length > 0) {
                const [longitude, latitude] = data.features[0].geometry.coordinates;
                map.flyTo({ center: [longitude, latitude], zoom: 12, pitch: 45, essential: true });
                displayCoordinates(latitude, longitude);
                fetchLocationInsights(latitude, longitude);
                fetchElevation(latitude, longitude);
            } else {
                showNotification("Location not found!", "warning");
            }
        })
        .catch(error => {
            loadingOverlay.style.display = "none";
            showNotification("Search error!", "error");
        });
}

function fetchLocationInsights(lat, lng) {
    // Reverse Geocoding
    fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_ACCESS_TOKEN}`)
        .then(response => response.json())
        .then(data => {
            const locationName = data.features[0]?.place_name || "Unknown Location";
            document.getElementById("insight-location").textContent = `Location: ${locationName}`;
        });

    // Weather from OpenWeather
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

function fetchElevation(lat, lng) {
    fetch(`https://api.mapbox.com/v4/mapbox.mapbox-terrain-v2/tilequery/${lng},${lat}.json?access_token=${MAPBOX_ACCESS_TOKEN}`)
        .then(response => response.json())
        .then(data => {
            let elevation = data.features?.find(f => f.properties.ele)?.properties.ele;
            if (elevation !== undefined) {
                const unit = useKilometers ? "m" : "ft";
                const value = useKilometers ? elevation : (elevation * 3.28084);
                document.getElementById("elevation").textContent = `Elevation: ${value.toFixed(1)} ${unit}`;
            } else {
                document.getElementById("elevation").textContent = "Elevation: Not available";
            }
        });
}

/**
 * 4. UTILITY FUNCTIONS
 */

function displayCoordinates(latitude, longitude) {
    document.getElementById("latitude").textContent = `Latitude: ${latitude.toFixed(6)}`;
    document.getElementById("longitude").textContent = `Longitude: ${longitude.toFixed(6)}`;
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = useKilometers ? 6371 : 3959; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function displayDistance(distance) {
    const unit = useKilometers ? "km" : "mi";
    document.getElementById("distance-value").textContent = `Distance: ${distance.toFixed(2)} ${unit}`;
}

function setupModal(buttonId, modalId) {
    const button = document.getElementById(buttonId);
    const modal = document.getElementById(modalId);
    if (!button || !modal) return;
    
    const close = modal.querySelector(".close");
    button.addEventListener("click", () => modal.style.display = "block");
    close.addEventListener("click", () => modal.style.display = "none");
    window.addEventListener("click", (e) => { if (e.target === modal) modal.style.display = "none"; });
}

function showNotification(message, type = "info") {
    const container = document.getElementById("notification-container");
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.textContent = message;
    container.appendChild(notification);
    setTimeout(() => notification.remove(), 5000);
}

function saveLocation(lat, lng, name) {
    savedLocations.push({ lat, lng, name });
    localStorage.setItem('geopulseSavedLocations', JSON.stringify(savedLocations));
    updateSavedLocations();
    showNotification(`Location "${name}" saved!`, "success");
}

function updateSavedLocations() {
    const list = document.getElementById("saved-list");
    list.innerHTML = "";
    savedLocations.forEach((loc, index) => {
        const li = document.createElement("li");
        li.textContent = `${loc.name} (${loc.lat.toFixed(2)}, ${loc.lng.toFixed(2)})`;
        li.addEventListener("click", () => {
            map.flyTo({ center: [loc.lng, loc.lat], zoom: 12 });
        });
        list.appendChild(li);
    });
}

function loadSavedLocations() {
    const stored = localStorage.getItem('geopulseSavedLocations');
    if (stored) {
        savedLocations = JSON.parse(stored);
        updateSavedLocations();
    }
}

function checkUrlForLocation() {
    const params = new URLSearchParams(window.location.search);
    const lat = params.get('lat');
    const lng = params.get('lng');
    if (lat && lng && map) {
        map.flyTo({ center: [parseFloat(lng), parseFloat(lat)], zoom: 12 });
    }
}

/**
 * 5. ADVANCED FEATURES (Corrected for Security)
 */

function calculateRoute() {
    // SECURITY CHECK: Ensure keys are loaded before proceeding
    if (!MAPBOX_ACCESS_TOKEN) {
        showNotification("Route service is initializing...", "warning");
        return;
    }

    const start = document.getElementById("route-start").value;
    const end = document.getElementById("route-end").value;
    
    if (!start || !end) {
        showNotification("Please enter both start and destination", "warning");
        return;
    }
    
    const routeTypeEl = document.querySelector(".route-type.active");
    const routeType = routeTypeEl ? routeTypeEl.getAttribute("data-type") : "driving";
    
    // UI Feedback
    const routeBtn = document.getElementById("calculate-route");
    routeBtn.classList.add("button-loading");
    routeBtn.disabled = true;
    
    // Geocode both points using the fetched token
    Promise.all([
        fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(start)}.json?access_token=${MAPBOX_ACCESS_TOKEN}`).then(res => res.json()),
        fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(end)}.json?access_token=${MAPBOX_ACCESS_TOKEN}`).then(res => res.json())
    ])
    .then(([startData, endData]) => {
        if (!startData.features?.length || !endData.features?.length) {
            throw new Error("One or both locations could not be found.");
        }
        
        const startCoords = startData.features[0].geometry.coordinates;
        const endCoords = endData.features[0].geometry.coordinates;
        
        // Directions API call
        return fetch(`https://api.mapbox.com/directions/v5/mapbox/${routeType}/${startCoords[0]},${startCoords[1]};${endCoords[0]},${endCoords[1]}?steps=true&geometries=geojson&access_token=${MAPBOX_ACCESS_TOKEN}`)
            .then(res => res.json());
    })
    .then(routeData => {
        routeBtn.classList.remove("button-loading");
        routeBtn.disabled = false;
        
        if (!routeData.routes?.length) throw new Error("No route found.");
        
        const route = routeData.routes[0];
        drawRoute(route); // Helper to handle map layers
        displayRouteMetrics(route.distance, route.duration);
    })
    .catch(error => {
        routeBtn.classList.remove("button-loading");
        routeBtn.disabled = false;
        showNotification(error.message, "error");
    });
}

function startVoiceRecognition() {
    if (!('webkitSpeechRecognition' in window)) {
        showNotification("Voice recognition not supported in this browser.", "error");
        return;
    }
    
    const recognition = new webkitSpeechRecognition();
    recognition.lang = 'en-US';
    showNotification("Listening...", "info");
    
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        document.getElementById("location-input").value = transcript;
        searchLocation(transcript); // searchLocation already has the token check
    };
    
    recognition.start();
}

/**
 * 6. MAP LAYER HELPERS
 */

function drawRoute(route) {
    if (!map) return;

    if (map.getSource('route')) {
        map.getSource('route').setData({
            'type': 'Feature',
            'properties': {},
            'geometry': route.geometry
        });
    } else {
        map.addSource('route', {
            'type': 'geojson',
            'data': {
                'type': 'Feature',
                'properties': {},
                'geometry': route.geometry
            }
        });
        
        map.addLayer({
            'id': 'route',
            'type': 'line',
            'source': 'route',
            'layout': { 'line-join': 'round', 'line-cap': 'round' },
            'paint': { 'line-color': '#FFD700', 'line-width': 5 }
        });
    }

    // Zoom map to fit the route
    const bounds = route.geometry.coordinates.reduce((acc, coord) => {
        return acc.extend(coord);
    }, new mapboxgl.LngLatBounds(route.geometry.coordinates[0], route.geometry.coordinates[0]));
    
    map.fitBounds(bounds, { padding: 50 });
}

function displayRouteMetrics(distanceInMeters, durationInSeconds) {
    const routeDetails = document.getElementById("route-details");
    const distEl = document.getElementById("route-distance");
    const durEl = document.getElementById("route-duration");
    
    routeDetails.classList.remove("hidden");
    
    const km = distanceInMeters / 1000;
    const distanceStr = useKilometers ? `${km.toFixed(1)} km` : `${(km * 0.621).toFixed(1)} mi`;
    const durationStr = `${Math.floor(durationInSeconds / 3600)}h ${Math.round((durationInSeconds % 3600) / 60)}m`;
    
    distEl.textContent = `Distance: ${distanceStr}`;
    durEl.textContent = `Duration: ${durationStr}`;
}
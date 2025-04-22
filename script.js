let map;
let useKilometers = true;
let savedLocations = [];
let measurePoints = [];
let userLoggedIn = false;
let darkMode = true;

// Define API keys globally
const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoibW9la2lub3RpIiwiYSI6ImNtOHJidXZ0MDB1N3oyaXF4MjQ4amZ1bTYifQ.yJSEvp1pcvHkocoa925yEA';
const OPENWEATHER_API_KEY = '30e2b4fb1ff82c05cb21b9ffd9dab445';

function initMap() {
    mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;
    map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/dark-v10',
        center: [36.817223, -1.286389], // [lng, lat]
        zoom: 8,
        pitch: 60, // 3D tilt angle (0-60 degrees)
        bearing: 0 // Optional: rotation angle
    });

    // Show loading overlay
    const loadingOverlay = document.getElementById("loading-overlay");
    loadingOverlay.style.display = "flex";

    // Hide loading overlay when map loads
    map.on('load', () => {
        loadingOverlay.style.display = "none";
        
        // Setup map events after map loads
        setupMapEvents();
    });

    // Set up all event listeners
    setupEventListeners();
}

function setupMapEvents() {
    map.on('click', (e) => {
        const latitude = e.lngLat.lat;
        const longitude = e.lngLat.lng;
        displayCoordinates(latitude, longitude);
        fetchLocationInsights(latitude, longitude);
        fetchElevation(latitude, longitude);
        
        // Handle measurement points
        if (measurePoints.length < 2) {
            measurePoints.push([latitude, longitude]);
            if (measurePoints.length === 2) {
                // Fill the distance calculator form with these points
                document.getElementById("point1-lat").value = measurePoints[0][0];
                document.getElementById("point1-lng").value = measurePoints[0][1];
                document.getElementById("point2-lat").value = measurePoints[1][0];
                document.getElementById("point2-lng").value = measurePoints[1][1];
                
                // Calculate distance
                const distance = calculateDistance(
                    measurePoints[0][0], measurePoints[0][1],
                    measurePoints[1][0], measurePoints[1][1]
                );
                displayDistance(distance);
                
                // Reset for next measurement
                measurePoints = [];
            }
        }
    });
}

function setupEventListeners() {
    // Search functionality
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

    // Voice search
    document.getElementById("voice-button").addEventListener("click", startVoiceRecognition);

    // Help modal
    setupModal("help-button", "help-modal");
    
    // Share modal
    setupModal("share-location", "share-modal");
    
    // Login modal 
    setupModal("user-account", "login-modal");
    
    // Export modal
    setupModal("export-locations", "export-modal");

    // Unit toggle
    document.getElementById("unit-btn").addEventListener("click", () => {
        useKilometers = !useKilometers;
        document.getElementById("unit-btn").textContent = useKilometers ? "KM" : "MI";
        
        // Recalculate any displayed distances
        if (document.getElementById("distance-value").textContent !== "Distance: -") {
            const point1Lat = parseFloat(document.getElementById("point1-lat").value);
            const point1Lng = parseFloat(document.getElementById("point1-lng").value);
            const point2Lat = parseFloat(document.getElementById("point2-lat").value);
            const point2Lng = parseFloat(document.getElementById("point2-lng").value);
            if (!isNaN(point1Lat) && !isNaN(point1Lng) && !isNaN(point2Lat) && !isNaN(point2Lng)) {
                const distance = calculateDistance(point1Lat, point1Lng, point2Lat, point2Lng);
                displayDistance(distance);
            }
        }
    });

    // Mode toggle (dark/light)
    document.getElementById("mode-toggle").addEventListener("click", () => {
        darkMode = !darkMode;
        document.body.classList.toggle("light-mode");
        
        // Update map style
        map.setStyle(darkMode ? 'mapbox://styles/mapbox/dark-v10' : 'mapbox://styles/mapbox/light-v10');
        
        // Update icon
        document.querySelector("#mode-toggle i").className = darkMode ? "fas fa-moon" : "fas fa-sun";
    });

    // Center on user location
    document.getElementById("center-btn").addEventListener("click", centerOnUserLocation);
    
    // Tilt controls
    document.getElementById("tilt-up").addEventListener("click", () => {
        const currentPitch = map.getPitch();
        const newPitch = Math.min(currentPitch + 10, 60); // Max pitch is 60
        map.setPitch(newPitch);
    });
    
    document.getElementById("tilt-down").addEventListener("click", () => {
        const currentPitch = map.getPitch();
        const newPitch = Math.max(currentPitch - 10, 0); // Min pitch is 0
        map.setPitch(newPitch);
    });

    // Distance calculator
    document.getElementById("distance-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const point1Lat = parseFloat(document.getElementById("point1-lat").value);
        const point1Lng = parseFloat(document.getElementById("point1-lng").value);
        const point2Lat = parseFloat(document.getElementById("point2-lat").value);
        const point2Lng = parseFloat(document.getElementById("point2-lng").value);
        if (isNaN(point1Lat) || isNaN(point1Lng) || isNaN(point2Lat) || isNaN(point2Lng)) {
            showNotification("Please enter valid coordinates!", "error");
            return;
        }
        const distance = calculateDistance(point1Lat, point1Lng, point2Lat, point2Lng);
        displayDistance(distance);
    });
    
    // Use map points button for distance calculation
    document.getElementById("use-map-points").addEventListener("click", () => {
        showNotification("Click two points on the map to measure distance", "info");
        measurePoints = [];
    });

    // Save location
    document.getElementById("save-location").addEventListener("click", () => {
        const lat = parseFloat(document.getElementById("latitude").textContent.split(": ")[1]);
        const lng = parseFloat(document.getElementById("longitude").textContent.split(": ")[1]);
        const name = document.getElementById("insight-location").textContent.split(": ")[1];
        
        if (isNaN(lat) || isNaN(lng)) {
            showNotification("No location selected to save", "warning");
            return;
        }
        
        saveLocation(lat, lng, name);
        showNotification(`Location "${name}" saved successfully!`, "success");
    });
    
    // Share location
    document.getElementById("share-location").addEventListener("click", () => {
        const lat = document.getElementById("latitude").textContent.split(": ")[1];
        const lng = document.getElementById("longitude").textContent.split(": ")[1];
        
        if (lat === "Click map" || lng === "Click map") {
            showNotification("No location selected to share", "warning");
            return;
        }
        
        const shareUrl = `https://mugambidev.github.io/GeoPulse/?lat=${lat}&lng=${lng}`;
        document.getElementById("share-url").value = shareUrl;
        document.getElementById("share-modal").style.display = "block";
    });
    
    // Copy share link
    document.getElementById("copy-link").addEventListener("click", () => {
        const shareUrl = document.getElementById("share-url");
        shareUrl.select();
        document.execCommand("copy");
        showNotification("Link copied to clipboard!", "success");
    });
    
    // Social sharing buttons
    document.getElementById("share-twitter").addEventListener("click", () => {
        const shareUrl = document.getElementById("share-url").value;
        window.open(`https://twitter.com/intent/tweet?text=Check%20out%20this%20location%20on%20GeoPulse!&url=${encodeURIComponent(shareUrl)}`, '_blank');
    });
    
    document.getElementById("share-facebook").addEventListener("click", () => {
        const shareUrl = document.getElementById("share-url").value;
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
    });
    
    // Route planner
    document.getElementById("calculate-route").addEventListener("click", calculateRoute);
    
    // Route type selectors
    const routeTypes = document.querySelectorAll(".route-type");
    routeTypes.forEach(btn => {
        btn.addEventListener("click", () => {
            routeTypes.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
        });
    });
    
    // User account form switching
    document.getElementById("signup-link").addEventListener("click", (e) => {
        e.preventDefault();
        document.getElementById("login-form").classList.add("hidden");
        document.getElementById("signup-form").classList.remove("hidden");
    });
    
    document.getElementById("login-link").addEventListener("click", (e) => {
        e.preventDefault();
        document.getElementById("signup-form").classList.add("hidden");
        document.getElementById("login-form").classList.remove("hidden");
    });
    
    // Login button
    document.getElementById("login-button").addEventListener("click", (e) => {
        e.preventDefault();
        const email = document.getElementById("username").value;
        const password = document.getElementById("password").value;
        
        if (!email || !password) {
            showNotification("Please enter email and password", "warning");
            return;
        }
        
        // Mock login - in a real app, this would connect to a backend
        simulateLogin(email);
    });
    
    // Signup button
    document.getElementById("signup-button").addEventListener("click", (e) => {
        e.preventDefault();
        const email = document.getElementById("new-email").value;
        const password = document.getElementById("new-password").value;
        const confirmPassword = document.getElementById("confirm-password").value;
        
        if (!email || !password || !confirmPassword) {
            showNotification("Please fill all fields", "warning");
            return;
        }
        
        if (password !== confirmPassword) {
            showNotification("Passwords do not match", "error");
            return;
        }
        
        // Mock signup - in a real app, this would connect to a backend
        simulateLogin(email);
    });
    
    // Logout button
    document.getElementById("logout-button").addEventListener("click", () => {
        userLoggedIn = false;
        document.getElementById("user-profile").classList.add("hidden");
        document.getElementById("login-form").classList.remove("hidden");
        document.getElementById("login-modal").style.display = "none";
        showNotification("Logged out successfully", "info");
    });
    
    // Export buttons
    document.getElementById("export-json").addEventListener("click", () => exportLocations("json"));
    document.getElementById("export-csv").addEventListener("click", () => exportLocations("csv"));
    document.getElementById("export-kml").addEventListener("click", () => exportLocations("kml"));
    
    // Check URL for shared location params
    checkUrlForLocation();
}

function setupModal(buttonId, modalId) {
    const button = document.getElementById(buttonId);
    const modal = document.getElementById(modalId);
    const close = modal.querySelector(".close");
    
    button.addEventListener("click", () => {
        modal.style.display = "block";
    });
    
    close.addEventListener("click", () => {
        modal.style.display = "none";
    });
    
    window.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.style.display = "none";
        }
    });
}

function searchLocation(location) {
    const loadingOverlay = document.getElementById("loading-overlay");
    loadingOverlay.style.display = "flex";
    
    fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(location)}.json?access_token=${MAPBOX_ACCESS_TOKEN}`)
        .then(response => response.json())
        .then(data => {
            loadingOverlay.style.display = "none";
            if (data.features && data.features.length > 0) {
                const [longitude, latitude] = data.features[0].geometry.coordinates;
                map.flyTo({
                    center: [longitude, latitude],
                    zoom: 12,
                    pitch: 45,
                    essential: true
                });
                displayCoordinates(latitude, longitude);
                fetchLocationInsights(latitude, longitude);
                fetchElevation(latitude, longitude);
            } else {
                showNotification("Location not found!", "warning");
            }
        })
        .catch(error => {
            loadingOverlay.style.display = "none";
            console.error("Search error:", error);
            showNotification("Error searching location!", "error");
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
    // Fetch address information
    fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_ACCESS_TOKEN}`)
        .then(response => response.json())
        .then(data => {
            const locationName = data.features[0]?.place_name || "Unknown Location";
            document.getElementById("insight-location").textContent = `Location: ${locationName}`;
        })
        .catch(() => {
            document.getElementById("insight-location").textContent = "Location: Not available";
        });

    // Fetch weather information
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
    
    // Fetch timezone information
    fetch(`https://api.mapbox.com/v4/examples.4ze9z6tv/tilequery/${lng},${lat}.json?access_token=${MAPBOX_ACCESS_TOKEN}`)
        .then(response => response.json())
        .then(data => {
            const timezone = data.features[0]?.properties?.TZID || 
                            Intl.DateTimeFormat().resolvedOptions().timeZone || 
                            "Unknown";
            document.getElementById("insight-timezone").textContent = `Timezone: ${timezone}`;
        })
        .catch(() => {
            document.getElementById("insight-timezone").textContent = `Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`;
        });
}

function fetchElevation(lat, lng) {
    fetch(`https://api.mapbox.com/v4/mapbox.mapbox-terrain-v2/tilequery/${lng},${lat}.json?access_token=${MAPBOX_ACCESS_TOKEN}`)
        .then(response => response.json())
        .then(data => {
            let elevation = null;
            if (data.features && data.features.length > 0) {
                for (const feature of data.features) {
                    if (feature.properties.ele) {
                        elevation = feature.properties.ele;
                        break;
                    }
                }
            }
            
            if (elevation !== null) {
                const unit = useKilometers ? "m" : "ft";
                const value = useKilometers ? elevation : (elevation * 3.28084);
                document.getElementById("elevation").textContent = `Elevation: ${value.toFixed(1)} ${unit}`;
            } else {
                document.getElementById("elevation").textContent = "Elevation: Not available";
            }
        })
        .catch(() => {
            document.getElementById("elevation").textContent = "Elevation: Not available";
        });
}

function saveLocation(lat, lng, name) {
    // Check if location already exists
    const exists = savedLocations.some(loc => 
        loc.lat === lat && 
        loc.lng === lng && 
        loc.name === name
    );
    
    if (exists) {
        showNotification("This location is already saved", "info");
        return;
    }
    
    savedLocations.push({ lat, lng, name });
    localStorage.setItem('geopulseSavedLocations', JSON.stringify(savedLocations));
    updateSavedLocations();
}

function updateSavedLocations() {
    const list = document.getElementById("saved-list");
    list.innerHTML = "";
    
    if (savedLocations.length === 0) {
        const emptyMsg = document.createElement("li");
        emptyMsg.textContent = "No saved locations yet";
        emptyMsg.style.cursor = "default";
        list.appendChild(emptyMsg);
        return;
    }
    
    savedLocations.forEach((loc, index) => {
        const li = document.createElement("li");
        
        const nameSpan = document.createElement("span");
        nameSpan.className = "location-name";
        nameSpan.textContent = `${loc.name} (${loc.lat.toFixed(2)}, ${loc.lng.toFixed(2)})`;
        
        const actionDiv = document.createElement("div");
        actionDiv.className = "location-actions";
        
        const deleteBtn = document.createElement("button");
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.title = "Delete location";
        deleteBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            savedLocations.splice(index, 1);
            localStorage.setItem('geopulseSavedLocations', JSON.stringify(savedLocations));
            updateSavedLocations();
            showNotification("Location deleted", "info");
        });
        
        actionDiv.appendChild(deleteBtn);
        li.appendChild(nameSpan);
        li.appendChild(actionDiv);
        
        li.addEventListener("click", () => {
            map.flyTo({
                center: [loc.lng, loc.lat],
                zoom: 12,
                pitch: 45,
                essential: true
            });
            displayCoordinates(loc.lat, loc.lng);
            fetchLocationInsights(loc.lat, loc.lng);
            fetchElevation(loc.lat, loc.lng);
        });
        
        list.appendChild(li);
    });
}

function startVoiceRecognition() {
    if (!('webkitSpeechRecognition' in window)) {
        showNotification("Voice recognition not supported in your browser!", "error");
        return;
    }
    
    const recognition = new webkitSpeechRecognition();
    recognition.lang = 'en-US';
    
    showNotification("Listening... speak now", "info");
    
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        document.getElementById("location-input").value = transcript;
        searchLocation(transcript);
    };
    
    recognition.onerror = (event) => {
        if (event.error === 'no-speech') {
            showNotification("No speech detected. Please try again.", "warning");
        } else {
            showNotification("Voice recognition failed! " + event.error, "error");
        }
    };
    
    recognition.onend = () => {
        document.getElementById("notification-container").querySelector(".notification.info")?.remove();
    };
    
    recognition.start();
}

function centerOnUserLocation() {
    if (!navigator.geolocation) {
        showNotification("Geolocation is not supported by your browser", "error");
        return;
    }
    
    showNotification("Getting your location...", "info");
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            map.flyTo({
                center: [lng, lat],
                zoom: 14,
                pitch: 45,
                essential: true
            });
            
            displayCoordinates(lat, lng);
            fetchLocationInsights(lat, lng);
            fetchElevation(lat, lng);
            
            // Show marker at user location
            new mapboxgl.Marker()
                .setLngLat([lng, lat])
                .addTo(map);
                
            // Remove the notification
            document.getElementById("notification-container").querySelector(".notification.info")?.remove();
        },
        (error) => {
            console.error("Geolocation error:", error);
            let errorMsg = "Unable to retrieve your location";
            
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMsg = "Location access denied. Please enable location services.";
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMsg = "Location information is unavailable.";
                    break;
                case error.TIMEOUT:
                    errorMsg = "Location request timed out.";
                    break;
            }
            
            showNotification(errorMsg, "error");
        }
    );
}

function calculateRoute() {
    const start = document.getElementById("route-start").value;
    const end = document.getElementById("route-end").value;
    
    if (!start || !end) {
        showNotification("Please enter both start and destination", "warning");
        return;
    }
    
    const routeTypeEl = document.querySelector(".route-type.active");
    const routeType = routeTypeEl ? routeTypeEl.getAttribute("data-type") : "driving";
    
    // Show loading state
    document.getElementById("calculate-route").classList.add("button-loading");
    document.getElementById("calculate-route").disabled = true;
    
    // First, geocode both locations
    Promise.all([
        fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(start)}.json?access_token=${MAPBOX_ACCESS_TOKEN}`).then(res => res.json()),
        fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(end)}.json?access_token=${MAPBOX_ACCESS_TOKEN}`).then(res => res.json())
    ])
    .then(([startData, endData]) => {
        if (!startData.features || startData.features.length === 0) {
            throw new Error("Start location not found");
        }
        if (!endData.features || endData.features.length === 0) {
            throw new Error("Destination not found");
        }
        
        const startCoords = startData.features[0].geometry.coordinates;
        const endCoords = endData.features[0].geometry.coordinates;
        
        // Get directions from Mapbox
        return fetch(`https://api.mapbox.com/directions/v5/mapbox/${routeType}/${startCoords[0]},${startCoords[1]};${endCoords[0]},${endCoords[1]}?steps=true&geometries=geojson&access_token=${MAPBOX_ACCESS_TOKEN}`)
            .then(res => res.json());
    })
    .then(routeData => {
        // Remove loading state
        document.getElementById("calculate-route").classList.remove("button-loading");
        document.getElementById("calculate-route").disabled = false;
        
        if (!routeData.routes || routeData.routes.length === 0) {
            throw new Error("No route found between these locations");
        }
        
        const route = routeData.routes[0];
        const routeDistance = route.distance / 1000; // convert to km
        const routeDuration = route.duration / 60; // convert to minutes
        
        // Display route details
        document.getElementById("route-details").classList.remove("hidden");
        document.getElementById("route-distance").textContent = `Distance: ${useKilometers ? routeDistance.toFixed(1) + " km" : (routeDistance * 0.621371).toFixed(1) + " mi"}`;
        document.getElementById("route-duration").textContent = `Duration: ${Math.floor(routeDuration / 60)}h ${Math.round(routeDuration % 60)}m`;
        
        // Draw the route on the map
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
                'layout': {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                'paint': {
                    'line-color': '#FFD700',
                    'line-width': 5
                }
            });
        }
        
        // Adjust the map to see the whole route
        const coordinates = route.geometry.coordinates;
        const bounds = coordinates.reduce((bounds, coord) => {
            return bounds.extend(coord);
        }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));
        
        map.fitBounds(bounds, {
            padding: 50
        });
    })
    .catch(error => {
        console.error("Route calculation error:", error);
        document.getElementById("calculate-route").classList.remove("button-loading");
        document.getElementById("calculate-route").disabled = false;
        showNotification(error.message || "Error calculating route", "error");
    });
}

function simulateLogin(email) {
    // This is just a mock login - in a real app you would verify credentials with a backend
    userLoggedIn = true;
    document.getElementById("user-email").textContent = email;
    document.getElementById("login-form").classList.add("hidden");
    document.getElementById("signup-form").classList.add("hidden");
    document.getElementById("user-profile").classList.remove("hidden");
    showNotification("Logged in successfully!", "success");
    
    // Load saved locations from localStorage
    loadSavedLocations();
}

function loadSavedLocations() {
    const stored = localStorage.getItem('geopulseSavedLocations');
    if (stored) {
        try {
            savedLocations = JSON.parse(stored);
            updateSavedLocations();
        } catch (e) {
            console.error("Error loading saved locations:", e);
            savedLocations = [];
        }
    }
}

function exportLocations(format) {
    if (savedLocations.length === 0) {
        showNotification("No locations to export", "warning");
        return;
    }
    
    let content, filename, type;
    
    switch (format) {
        case 'json':
            content = JSON.stringify(savedLocations, null, 2);
            filename = 'geopulse-locations.json';
            type = 'application/json';
            break;
            
        case 'csv':
            // Create CSV header
            content = 'Name,Latitude,Longitude\n';
            // Add each location
            savedLocations.forEach(loc => {
                content += `"${loc.name}",${loc.lat},${loc.lng}\n`;
            });
            filename = 'geopulse-locations.csv';
            type = 'text/csv';
            break;
            
        case 'kml':
            // Create KML format
            content = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>GeoPulse Saved Locations</name>
    <description>Exported from GeoPulse</description>`;
            
            savedLocations.forEach(loc => {
                content += `
    <Placemark>
      <name>${escapeXml(loc.name)}</name>
      <Point>
        <coordinates>${loc.lng},${loc.lat},0</coordinates>
      </Point>
    </Placemark>`;
            });
            
            content += `
  </Document>
</kml>`;
            filename = 'geopulse-locations.kml';
            type = 'application/vnd.google-earth.kml+xml';
            break;
    }
    
    // Create download link
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Close modal
    document.getElementById("export-modal").style.display = "none";
    showNotification(`Locations exported as ${format.toUpperCase()}`, "success");
}

function escapeXml(unsafe) {
    return unsafe.replace(/[<>&'"]/g, function (c) {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
        }
    });
}

function checkUrlForLocation() {
    const params = new URLSearchParams(window.location.search);
    const lat = params.get('lat');
    const lng = params.get('lng');
    
    if (lat && lng) {
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        
        if (!isNaN(latitude) && !isNaN(longitude)) {
            map.flyTo({
                center: [longitude, latitude],
                zoom: 12,
                pitch: 45,
                essential: true
            });
            
            displayCoordinates(latitude, longitude);
            fetchLocationInsights(latitude, longitude);
            fetchElevation(latitude, longitude);
            
            // Add marker for shared location
            new mapboxgl.Marker({ color: '#FFD700' })
                .setLngLat([longitude, latitude])
                .addTo(map);
                
            showNotification("Showing shared location", "info");
        }
    }
}

function showNotification(message, type) {
    const container = document.getElementById("notification-container");
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    
    const messageSpan = document.createElement("span");
    messageSpan.textContent = message;
    
    const closeBtn = document.createElement("button");
    closeBtn.className = "close-notification";
    closeBtn.innerHTML = "&times;";
    closeBtn.addEventListener("click", () => {
        notification.classList.add("fade-out");
        setTimeout(() => notification.remove(), 500);
    });
    
    notification.appendChild(messageSpan);
    notification.appendChild(closeBtn);
    container.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.add("fade-out");
            setTimeout(() => notification.remove(), 500);
        }
    }, 5000);
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Load saved locations if any
    loadSavedLocations();
    
    // Initialize the map
    initMap();
    
    // Set initial state of UI elements
    document.getElementById("unit-btn").textContent = useKilometers ? "KM" : "MI";
    document.querySelector("#mode-toggle i").className = darkMode ? "fas fa-moon" : "fas fa-sun";
    
    // Initialize coordinates display
    document.getElementById("latitude").textContent = "Latitude: Click map";
    document.getElementById("longitude").textContent = "Longitude: Click map";
    document.getElementById("insight-location").textContent = "Location: -";
    document.getElementById("insight-weather").textContent = "Weather: -";
    document.getElementById("insight-timezone").textContent = "Timezone: -";
    document.getElementById("elevation").textContent = "Elevation: -";
    document.getElementById("distance-value").textContent = "Distance: -";
    
    // Hide route details initially
    document.getElementById("route-details").classList.add("hidden");
    
    // Hide user profile initially
    document.getElementById("user-profile").classList.add("hidden");
    
    // Set up login form as default
    document.getElementById("login-form").classList.remove("hidden");
    document.getElementById("signup-form").classList.add("hidden");
});
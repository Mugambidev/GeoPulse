package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv" // Import the loader
)

type PublicConfig struct {
	MapboxToken string `json:"mapbox_token"`
}

var weatherClient = &http.Client{Timeout: 10 * time.Second}

var staticFiles = map[string]string{
	"/":           "index.html",
	"/index.html": "index.html",
	"/script.js":  "script.js",
	"/styles.css": "styles.css",
}

func main() {
	// LOAD THE .ENV FILE
	err := godotenv.Load()
	if err != nil {
		log.Println("Error loading .env file, checking system environment variables instead")
	}

	http.HandleFunc("/api/config", configHandler)
	http.HandleFunc("/api/weather", weatherHandler)

	http.HandleFunc("/", staticHandler)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	fmt.Printf("GeoPulse server starting on http://localhost:%s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}

func configHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	cfg := PublicConfig{
		MapboxToken: os.Getenv("MAPBOX_TOKEN"),
	}

	if cfg.MapboxToken == "" {
		http.Error(w, "Map configuration is not available", http.StatusServiceUnavailable)
		return
	}

	if err := json.NewEncoder(w).Encode(cfg); err != nil {
		log.Printf("write public config response: %v", err)
	}
}

func weatherHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	weatherKey := os.Getenv("OPENWEATHER_KEY")
	if weatherKey == "" {
		http.Error(w, "Weather service is not configured", http.StatusServiceUnavailable)
		return
	}

	lat, err := parseCoordinate(r.URL.Query().Get("lat"), -90, 90)
	if err != nil {
		http.Error(w, "Invalid latitude", http.StatusBadRequest)
		return
	}
	lng, err := parseCoordinate(r.URL.Query().Get("lng"), -180, 180)
	if err != nil {
		http.Error(w, "Invalid longitude", http.StatusBadRequest)
		return
	}

	endpoint := &url.URL{
		Scheme: "https",
		Host:   "api.openweathermap.org",
		Path:   "/data/2.5/weather",
	}
	query := endpoint.Query()
	query.Set("lat", strconv.FormatFloat(lat, 'f', 6, 64))
	query.Set("lon", strconv.FormatFloat(lng, 'f', 6, 64))
	query.Set("appid", weatherKey)
	query.Set("units", "metric")
	endpoint.RawQuery = query.Encode()

	request, err := http.NewRequestWithContext(r.Context(), http.MethodGet, endpoint.String(), nil)
	if err != nil {
		log.Printf("create weather request: %v", err)
		http.Error(w, "Weather service is unavailable", http.StatusBadGateway)
		return
	}

	response, err := weatherClient.Do(request)
	if err != nil {
		log.Printf("weather request: %v", err)
		http.Error(w, "Weather service is unavailable", http.StatusBadGateway)
		return
	}
	defer response.Body.Close()

	if response.StatusCode != http.StatusOK {
		log.Printf("weather service returned status %d", response.StatusCode)
		http.Error(w, "Weather service is unavailable", http.StatusBadGateway)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if _, err := io.Copy(w, response.Body); err != nil {
		log.Printf("copy weather response: %v", err)
	}
}

func parseCoordinate(value string, min, max float64) (float64, error) {
	coordinate, err := strconv.ParseFloat(value, 64)
	if err != nil || coordinate < min || coordinate > max {
		return 0, fmt.Errorf("coordinate must be between %v and %v", min, max)
	}

	return coordinate, nil
}

func staticHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet && r.Method != http.MethodHead {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	filename, ok := staticFiles[r.URL.Path]
	if !ok {
		http.NotFound(w, r)
		return
	}

	http.ServeFile(w, r, filename)
}

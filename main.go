package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/joho/godotenv" // Import the loader
)

type Config struct {
	MapboxToken string `json:"mapbox_token"`
	WeatherKey  string `json:"weather_key"`
}

func main() {
	// LOAD THE .ENV FILE
	err := godotenv.Load()
	if err != nil {
		log.Println("Error loading .env file, checking system environment variables instead")
	}

	http.HandleFunc("/api/config", configHandler)

	fs := http.FileServer(http.Dir("./"))
	http.Handle("/", fs)

	port := "8080"
	fmt.Printf("GeoPulse server starting on http://localhost:%s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}

func configHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// Now we ONLY fetch from the environment
	cfg := Config{
		MapboxToken: os.Getenv("MAPBOX_TOKEN"),
		WeatherKey:  os.Getenv("OPENWEATHER_KEY"),
	}

	// Safety check: if keys are missing, send an error
	if cfg.MapboxToken == "" || cfg.WeatherKey == "" {
		http.Error(w, "API keys not configured on server", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(cfg)
}

package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"
)

// GeoResponse defines the structure for our API responses
type GeoResponse struct {
	Status  string    `json:"status"`
	Message string    `json:"message"`
	Time    time.Time `json:"timestamp"`
}

func main() {
	// 1. Serve static files (Your HTML, CSS, JS)
	fs := http.FileServer(http.Dir("./"))
	http.Handle("/", fs)

	// 2. A Go-powered API endpoint for GeoPulse insights
	http.HandleFunc("/api/status", func(w http.ResponseWriter, r *http.Request) {
		res := GeoResponse{
			Status:  "Active",
			Message: "GeoPulse Go Backend is handling concurrency smoothly.",
			Time:    time.Now(),
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(res)
	})

	fmt.Println("GeoPulse server starting on :8080...")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

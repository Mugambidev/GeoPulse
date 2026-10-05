package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestConfigHandlerReturnsOnlyPublicMapboxToken(t *testing.T) {
	t.Setenv("MAPBOX_TOKEN", "pk.test-token")
	t.Setenv("OPENWEATHER_KEY", "private-weather-key")

	recorder := httptest.NewRecorder()
	configHandler(recorder, httptest.NewRequest(http.MethodGet, "/api/config", nil))

	if recorder.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, recorder.Code)
	}

	var config map[string]string
	if err := json.NewDecoder(recorder.Body).Decode(&config); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if config["mapbox_token"] != "pk.test-token" {
		t.Fatalf("unexpected mapbox token: %q", config["mapbox_token"])
	}
	if _, exists := config["weather_key"]; exists {
		t.Fatal("weather key must not be returned to the browser")
	}
}

func TestWeatherHandlerRejectsInvalidCoordinatesBeforeCallingProvider(t *testing.T) {
	t.Setenv("OPENWEATHER_KEY", "private-weather-key")

	recorder := httptest.NewRecorder()
	weatherHandler(recorder, httptest.NewRequest(http.MethodGet, "/api/weather?lat=91&lng=36", nil))

	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("expected status %d, got %d", http.StatusBadRequest, recorder.Code)
	}
}

func TestStaticHandlerDoesNotExposeProjectFiles(t *testing.T) {
	for _, path := range []string{"/.env", "/.env.example", "/main.go", "/README.md", "/render.yaml"} {
		recorder := httptest.NewRecorder()
		staticHandler(recorder, httptest.NewRequest(http.MethodGet, path, nil))

		if recorder.Code != http.StatusNotFound {
			t.Errorf("%s: expected status %d, got %d", path, http.StatusNotFound, recorder.Code)
		}
	}
}

func TestStaticHandlerServesApplicationAssets(t *testing.T) {
	for _, path := range []string{"/", "/index.html", "/script.js", "/styles.css"} {
		recorder := httptest.NewRecorder()
		staticHandler(recorder, httptest.NewRequest(http.MethodGet, path, nil))

		expectedStatus := http.StatusOK
		if path == "/index.html" {
			expectedStatus = http.StatusMovedPermanently
		}
		if recorder.Code != expectedStatus {
			t.Errorf("%s: expected status %d, got %d", path, expectedStatus, recorder.Code)
		}
	}
}

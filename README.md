# GeoPulse

GeoPulse is a browser-based map explorer for searching places, inspecting coordinates and local weather, measuring distances, and planning routes. The user interface is vanilla JavaScript; a small Go server serves the app and keeps the OpenWeather API key off the client.

## What works today

- Search for places with Mapbox Geocoding
- Click the map to view coordinates, a reverse-geocoded place name, weather, and elevation when the relevant provider data is available
- Center the map on the browser's current location (with permission)
- Calculate distance from entered coordinates or by selecting two map points
- Request driving, walking, or cycling routes from Mapbox Directions
- Switch between light and dark map styles, adjust pitch, and switch kilometres/miles for new measurements
- Save locations in the current browser with `localStorage`

## Not implemented yet

The account, sign-up, social sharing, and export dialogs are visual placeholders only. Saved locations are local to one browser; there is no account or cloud sync. Area measurement and offline support are also not implemented.

## Run locally

### Prerequisites

- Go 1.25 or newer
- A Mapbox **public** token with the required Mapbox API scopes
- An OpenWeather API key

### Configuration

Copy `.env.example` to `.env` in the project root, then add your values:

```env
MAPBOX_TOKEN=pk_your_mapbox_public_token
OPENWEATHER_KEY=your_openweather_key
```

`MAPBOX_TOKEN` is supplied to the browser because Mapbox GL JS requires a public token. Restrict that token to the production URL and the smallest set of scopes required. `OPENWEATHER_KEY` remains on the Go server and is used only by `/api/weather`.

### Start the app

```bash
go run .
```

Open [http://localhost:8080](http://localhost:8080). Set `PORT` to use a different port.

## Test

```bash
go test ./...
go vet ./...
```

## Deploy on Render

`render.yaml` defines a Go web service. Configure `MAPBOX_TOKEN` and `OPENWEATHER_KEY` as Render secret environment variables before deploying. The server reads Render's `PORT` automatically.

## Structure

```text
main.go       Go server, public map configuration, and protected weather proxy
script.js     Map interactions and browser UI
index.html    Application markup
styles.css    Application styles
render.yaml   Render Blueprint
```

## License

MIT © 2023 Mugambi Kinoti

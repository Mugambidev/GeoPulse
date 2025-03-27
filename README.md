# GeoPulse 🌍

GeoPulse is a modern web application for exploring geographical data with an interactive 3D map. Powered by Mapbox, it allows users to search locations, calculate distances, view coordinates, get weather and address insights, and save favorite spots—all within a sleek, user-friendly interface.

## Features 🚀

- **3D Map View**: Explore locations with a dynamic 3D map tilt using Mapbox GL JS.
- **Search Locations**: Find any place by name or address and center the map on it.
- **Coordinates Display**: View real-time latitude and longitude of the map center or clicked points.
- **Distance Calculator**: Calculate the distance between two points using the Haversine formula.
- **Location Insights**: Get weather (via OpenWeatherMap) and address details for any clicked location.
- **Save Locations**: Save and revisit your favorite spots with a single click.
- **Night/Light Mode**: Toggle between dark and light themes for a comfortable experience.
- **Voice Search**: Use voice recognition to search for locations hands-free.

## Usage 💻

GeoPulse is hosted on GitHub Pages and can be accessed directly at [https://mugambidev.github.io/GeoPulse/](https://mugambidev.github.io/GeoPulse/). To run it locally:

1. Clone the repository:
   ```bash
   git clone https://github.com/Mugambidev/GeoPulse.git
   cd GeoPulse
   ```
2. Open `index.html` in a modern web browser.

## Setup for Development 🛠️

To run GeoPulse locally with full functionality, you’ll need to set up API keys and a backend proxy:

### Clone the Repository:

```bash
git clone https://github.com/Mugambidev/GeoPulse.git
cd GeoPulse
```

### Set Up API Keys (Local Testing):

Create a `config.js` file from the template:

```bash
cp config.template.js config.js
```

Add your Mapbox and OpenWeatherMap API keys to `config.js`. 

> **Note**: The current deployment on GitHub Pages has API keys hardcoded in `script.js` for simplicity, but this is not secure for production.

### Backend Proxy (Recommended for Production):

GeoPulse uses a backend proxy to securely handle API requests. The backend is hosted on Render (see the [GeoPulse-Backend repository](https://github.com/Mugambidev/GeoPulse-Backend) for details).

- Deploy the backend on Render and update `script.js` with your Render backend URL (e.g., `https://your-render-url.onrender.com`).

### Run Locally:

Use a local server (e.g., `live-server`) to avoid CORS issues:

```bash
npm install -g live-server
live-server
```

Open `index.html` in your browser.

> **Security Note**: The Mapbox token in `script.js` is currently hardcoded for GitHub Pages deployment. For production, proxy map tile requests through the backend to secure the token.

## Technologies Used 💡

- **HTML5**
- **CSS3**
- **JavaScript**
- **Mapbox GL JS**
- **OpenWeatherMap API**
- **Node.js** (for backend proxy)
- **Render** (for hosting the backend)

## Credits 🙏

GeoPulse was created with ❤️ by **Mugambi Kinoti**.

### Acknowledgments 🙌

- **Mapbox Documentation**: For excellent guides on integrating Mapbox GL JS.
- **OpenWeatherMap API**: For providing weather data.
- **Stack Overflow and MDN Web Docs**: For troubleshooting and best practices.
- **Render**: For free backend hosting.
- **W3Schools and YouTube Tutorials**: For learning resources on web development and APIs.

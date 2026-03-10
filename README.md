# GeoPulse 🌍

GeoPulse is a comprehensive geospatial exploration tool with an interactive 3D map interface. Powered by Mapbox and OpenWeatherMap, it offers advanced location analysis, measurement tools, and personalized data management in a sleek, responsive design.

## Features 🚀

### Core Functionality
- **Immersive 3D Map**: Dynamic tilt (0-60°) and rotation controls with Mapbox GL JS
- **Precision Location Tools**:
  - Coordinate display (6 decimal places)
  - Elevation data (meters/feet)
  - Timezone detection
- **Smart Search**:
  - Text-based location search
  - Voice recognition (Web Speech API)
  - URL sharing with geo-parameters

### Measurement Tools
- **Distance Calculator**: Haversine formula with km/mi toggle
- **Route Planner**: Multi-mode routing (drive/walk/cycle)
- **Area Measurement**: Coming soon!

### Location Intelligence
- **Weather Insights**: Real-time data from OpenWeatherMap
- **Address Details**: Full place information
- **Elevation Profile**: Terrain elevation data

### Personalization
- **Saved Locations**: Persistent storage with localForage
- **Custom Themes**: Dark/light mode toggle
- **Unit Preferences**: Metric/imperial system toggle

### Data Management
- **Export Formats**: JSON, CSV, and KML
- **Shared Locations**: URL parameter support
- **User Accounts**: Coming soon!

## Usage 💻

### Web Access
Live demo: [https://mugambidev.github.io/GeoPulse/](https://mugambidev.github.io/GeoPulse/)

### Local Development
```bash
git clone https://github.com/Mugambidev/GeoPulse.git
cd GeoPulse
npm install
npm run dev
```

## Development Setup 🛠️

### Prerequisites
* Node.js v16+
* Mapbox API key
* OpenWeatherMap API key

### Configuration
1. Create `.env` file:
```bash
cp .env.example .env
```

2. Add your API keys:
```
VITE_MAPBOX_TOKEN=your_mapbox_token
VITE_OPENWEATHER_KEY=your_owm_key
```

### Recommended Tools
* Vite for development server
* ESLint for code quality
* Prettier for code formatting

### Production Build
```bash
npm run build
```

## Architecture 💡

### Backend (Updated!)
* **Engine**: Go (Golang) 1.21+
* **Features**: High-performance static file serving, RESTful API endpoints, and concurrent request handling.
* **Server**: Custom `net/http` implementation.

### Frontend
* **Core**: Mapbox GL JS, Vanilla JavaScript
* **UI**: Custom CSS with Dark/Light Academia variables
## Security 🔒

### Best Practices
* API keys should never be committed
* Use environment variables
* Implement backend proxy for production
* Rate limiting recommended for public deployments

## Roadmap 🗺️

### Next Features
* User authentication
* Collaborative maps
* GeoJSON import/export
* Offline mode support

## Contributing 🤝

We welcome contributions! Please:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## Support ❤️

Having trouble? Open an issue or contact kinotimoe@gmail.com

## License

MIT © 2023 Mugambi Kinoti

## Acknowledgments 🙌

* Mapbox team for excellent documentation
* OpenWeatherMap for reliable weather data
* MDN Web Docs for JavaScript references
* Vite community for build tools
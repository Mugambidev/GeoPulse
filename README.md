# GeoPulse 🌍

Survey Studio is a powerful web application that enables users to perform various geographical calculations. With a user-friendly map interface, you can calculate distances, areas, view coordinates and more!

## Features 🚀

- **Search Location**: Find any location by entering its name or address in the search bar. The map will automatically center on your searched location.
- **Coordinates Display**: Stay informed with real-time display of the latitude and longitude coordinates of the current map center.
- **Distance Calculation**: Calculate the distance between two points by inputting their latitude and longitude coordinates. We use the Haversine formula for accurate results.
- **Area Calculation**: Define a polygon on the map by clicking multiple points. Once you've defined the polygon, the application calculates its area using the Google Maps API.

## Usage 💻

Using Survey Studio is as simple as opening the `index.html` file in a web browser. The map interface will load, and you can start interacting with the various features.

## Credits 🙏

Survey Studio was created with ❤️ by Mugambi Kinoti.

## Technologies Used 💡

- HTML5
- CSS3
- JavaScript
- Google Maps API

## Installation Guide 📥

Survey Studio is a web-based application and doesn't require traditional installation. However, you need to set it up correctly to make it work. Here are the steps:

1. **Clone or Download the Repository**: If you're familiar with Git, clone the repository to your local machine.

2. **Obtain a Google Maps API Key**: Survey Studio uses the Google Maps API, which requires an API key. You can obtain this key from the Google Cloud Console. Remember to enable the Maps JavaScript API for your key.

3. **Add the API Key to Your Project**: Open the `index.html` file in a text editor. Locate the script tag where the Google Maps API is loaded. It should look something like this: `<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY"></script>`. Replace `YOUR_API_KEY` with the API key you obtained from the Google Cloud Console.

4. **Open the Project**: Open the `index.html` file in a modern web browser. You should see the Survey Studio interface, ready to use!

Remember, the Google Maps API key is sensitive information. Do not expose it in public repositories or share it with others. Enjoy using Survey Studio! 😊

## Google Maps API Usage 🌐

To use the Google Maps API in Survey Studio, you'll need to obtain an API key from Google. Here's how you can do it:

1. Visit the Google Cloud Console.
2. Create a new project or select an existing one.
3. Navigate to the 'APIs & Services' > 'Credentials' section.
4. Click on 'Create Credentials' and select 'API key'. Your new API key will be generated.

Once you have your API key:

1. Open the `index.html` file in a text editor.
2. Locate the script tag where Google Maps API is loaded. It should look something like this: `<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY"></script>`.
3. Replace `YOUR_API_KEY` with the API key you obtained from the Google Cloud Console.

For more details, please refer to the Google Maps Platform.

Remember to keep your API key secure and do not expose it in public repositories to prevent unauthorized usage.

## Acknowledgments 🙌

While developing Survey Studio, I found the following resources extremely helpful:

1. **Google Maps JavaScript API Documentation**: The comprehensive documentation provided by Google was invaluable in understanding how to integrate and use the Maps API effectively.

2. **Stack Overflow**: Numerous threads on Stack Overflow helped me troubleshoot issues and understand best practices.

3. **MDN Web Docs**: The Mozilla Developer Network (MDN) web docs are a great resource for understanding web technologies such as HTML, CSS, and JavaScript.

4. **W3Schools**: W3Schools tutorials were beneficial in brushing up on my coding skills and learning new concepts.

5. **YouTube Tutorials**: Several YouTube channels provided insightful videos on using the Google Maps API and working with geographical data.

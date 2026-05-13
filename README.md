# 🌱 Cellulose

Cellulose is a modern frontendnonly (for now) web application designed to be your ultimate gardening companion. Built for a hackathon, Cellulose helps you search for plants, manage your garden, and receive smart, automated care reminders.

Features
**Plant Database**: Search through a library of plants to learn about their sunlight, soil, and watering needs.
**Companion Planting Guide**: Discover which plants thrive together and which to keep apart.
**Google Calendar Sync *(Work in Progress)***: Seamlessly sync watering, fertilizing, and pruning schedules directly to your personal Google Calendar.
**AI Plant Doctor *(Work in Progress)***: Upload a photo of a sick plant, and our AI (powered by the Gemini Vision API) will diagnose the issue and prescribe a step-by-step treatment plan!
**Smart Weather Awareness**: Uses the Open-Meteo REST API and Geolocation to dynamically adjust your watering reminders if heavy rain is forecast in your area.

Built With
* **Frontend Core**: Vanilla JavaScript (ES6+), HTML5, CSS3 (Custom CSS Grid, Variables, and Animations)
* **Authentication**: Google Identity Services (OAuth 2.0)
* **APIs**: Google Calendar API, Google Gemini 1.5 Flash Vision API, Open-Meteo API, Browser Geolocation API
* **Architecture**: Custom Single Page Application (SPA) with hash-based routing and `localStorage` state management.

Current Status
The core UI, plant database, and state management are fully functional. **The Google Calendar Sync and AI Plant Doctor features are currently a Work in Progress** as I continue to refine the API integrations and UX flows.

Running Locally
Because Cellulose is a frontend-only application without a backend server (for now), you can run it locally using any basic HTTP server (like Vite or Live Server).

1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/cellulose.git
   ```
2. Navigate into the directory:
   ```bash
   cd cellulose
   ```
3. Start a local development server. If you have Node.js installed, you can use `npx`:
   ```bash
   npx serve .
   ```
4. Open the provided `localhost` URL in your browser.

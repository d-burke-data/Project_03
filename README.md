# U.S. Tornado Event Analysis

## Team Members
- Heather Richardson
- Brianna Mitri
- Sarah Gutierrez
- David Burke

## Project Overview
This project aims to analyze tornado events from 1950 to 2024 through interactive visualizations and statistical summaries. [Click here for the dashboard](www.google.com)

## Instructions 
In the website, users can pick from various dropdown options based on their tornado interests, selecting a specific time frame and location. A user begins by navigating through the path of a unique tornado, gaining information about the event at each marker they choose. As they continue, users will be able to understand the severity of occurrences during their selected time period.

## Ethicial Consideration  
This project is based on a publicly available dataset, ensuring transparency and accessibility of the data used. As the dataset is open to public use and does not contain personally identifiable or sensitive information, no ethical concerns were identified in its application.

## Research Questions
- What areas are most prone to tornadoes?
- Where have the most deadly tornado events occurred?
- How have storm event frequency and severity changed over time?
- How many injuries and fatalities have resulted from tornadoes?
- What is the amount of property and crop damage caused by tornadoes?

## Visualizations
- **Interactive Leaflet Map**: Displays tornado start and end points to approximate tornado paths. Each marker contains a popup with event details and narratives.
- **Heatmaps**: Illustrate storm event concentration, casualties, and damage.
- **Trend Graphs**: Show event frequency and severity changes over time, including seasonal patterns.
- **Pie Chart**: Represents the percentage of tornadoes by severity (based on the Fujita scale) for a given area and time.
- **Filterable Visualizations**: Users can filter data by date, event type, severity, casualties, and damage.

## Backend
- **Database**: SQLite database storing storm event data.
- **Web Development**: Web pages built using Bootstrap.
- **Flask Application**: Serves the website and interfaces with the database.

## Data Sources
- **Storm Event Data**: [NOAA Storm Events Database](https://www.ncdc.noaa.gov/stormevents/)
- **National Weather Service Forecast Zone Shapefiles**: [NWS Public Zones](https://www.weather.gov/gis/PublicZones)

## Plugins & Libraries
- **Leaflet**: [https://leafletjs.com/](https://leafletjs.com/)
- **chroma.js**: [https://gka.github.io/chroma.js/](https://gka.github.io/chroma.js/)
- **leaflet-marker-direction**: [https://github.com/Thomas2077/leaflet-marker-direction](https://github.com/Thomas2077/leaflet-marker-direction)
- **heatmap.js**: [https://www.patrick-wied.at/static/heatmapjs/plugin-leaflet-layer.html](https://www.patrick-wied.at/static/heatmapjs/plugin-leaflet-layer.html)


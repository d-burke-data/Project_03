# U.S. Tornado Events Dashboard
This interactive web application dashboard is based on nearly 80k tornado event records in the U.S. from 1950-2024. Explore the final product here: https://d-burke-data.github.io/Project_03/

Three main parts:
1) **ETL:** an ETL pipeline to load a relational SQLite database with three tables (*using Python*)
2) **API:** a Flask app API (publicly available here: https://bmitri.pythonanywhere.com/) to interact with the database for the backend of the web app (*using Python*)
3) **Web Application:** interactive dashboard with filter options for time, location, & tornado intensity (*using JavaScript and HTML*)

## Frontend: Web App
Interactive dashboard web app with dropdown options to filter data by time (required), location, & EF-scale. The following visualizations are generated by data from API calls based on user-inputs:

### Leaflet Map
Comes with three overlay options:
- **Counties:** combines API outputed data with GeoJSON to generate colored overlay based on number of events per county
- **Events:** utilizes individual event data to plot begin and end points of each event to showcase their path as well as detailed information in the popup
    - ***Triangle:*** begin point of tornado event 
    - ***Square:*** end point of tornado event (only visible when zooming into map)
    - ***Path:*** arrows pointing in the direction of the tornado's path. The longer the path, the larger the arrows
    - ***Marker color:*** based on EF-scale
- **Heatmap:** based on latitude and longitude begin points from each event

**EXAMPLE**  
**Zoomed in map with Events layer over Counties layer:** Clearly shows tornado events crossing county borders and even changing EF-scale ranking:
![image](https://github.com/user-attachments/assets/02200950-a656-460c-8a3d-50a89dc2b6fd)

### Plotly Charts
- **Pie chart:** displaying percentages of events categorized by their EF-scale ranking
- **Bar chart:** displays totals by month with options to see total events, deaths, injuries, property damage, or crop damage per month

### Summary Tables
- **Duration:** shows total time of tornado events during period and average time each tornado took
- **Totals:** shows overall totals for events, deaths, injuries and damages costs (property and crop)

## Backend: API & Database
Created an ETL pipeline to load transformed storm events & counties data to SQLite relational database with three tables: events, counties, and scales.

The Flask app API utilizes an ORM, SQLAlchemy, to interact with the relational database to produce jsonified queried data. Access the API here: https://bmitri.pythonanywhere.com/

**Main routes (with endpoints):**
- `/api/v1.0/dashboard`: produces filtered aggregated data for the entire dashboard and Counties map overlay
- `/api/v1.0/events`: produces filtered individual events data with counties data for the Events and Heatmap overlay (ex: lat/lon for each event)

**Endpoints:**
- ***Required:*** `?start_year` and `?duration` (number of years)
- ***Optional:*** `?state` (state abbreviation), `?fip` (county FIP code), and `?scale` (EF/F scale level)
- Example API URL: https://bmitri.pythonanywhere.com/api/v1.0/dashboard?start_year=2010&duration=10&state=IL&fip=17099&scale=1

**Extra routes (without endpoints):**
- `/api/v1.0/options`: lists years and states available in the database (*populates Years & States dropdown in web app*)
- `/api/v1.0/counties`: counties table data (*populates Counties dropdown in web app*)
- `/api/v1.0/scales`: scales table data (*populates EF-Scale dropdown in web app*)

**EXAMPLE**  
**Dashboard route vs Events route:** Both are using the same endpoints but we can see here (in the console of the web app) that the dashboard route produces *aggregated data*; meanwhile, the events route produces the *individual records*.
![image](https://github.com/user-attachments/assets/fca85df8-cad2-4477-8adb-017d806bd68d)

## Repository Directory
|Folder|Subfolder|Contents|
|---|---|---|
|API||Python Flask app<sup>1</sup>|
|Cleaning||Python Jupter Notebooks used to clean data before database import. *data_cleaning.ipnyb* is the file for cleaning tornado event CSV files (primary data)|
|Data|Input|Raw data|
||Input/Events|Select sample event details files. Full set of raw files can be acquired from [NOAA bulk download](https://www.ncdc.noaa.gov/stormevents/ftp.jsp)<sup>2</sup>|
||Input/UpdatedEvents|Manually updated events files<sup>2</sup>|
||Output|Output of Jupyter Notebooks|
|Database||SQLite database<sup>1</sup> and schema|
|docs||Web folder for GitHub Pages. *Index.html* is located here|
||static/js|JavaScript files used in the web app. *app.js* is original JavaScript. Other files are plugins from other sources.|
||static/js/data|Counties FIPS GeoJSON data file for county choropleth map layer|
|Work||Preliminary work and testing. **THIS FOLDER CAN BE SAFELY IGNORED.**|

**<sup>1</sup>** Flask app and SQLite database are presented here for completion, but are hosted at PythonAnywhere for the live dashboard.

**<sup>2</sup>** FIPS data was manually updated in some event details files. If you are downloading the entire dataset from NOAA bulk download, use these files in place of their corresponding originals.

## Plugins & Libraries
**Python:** Pandas, SQLite3, SQLAlchemy, Flask, NumPy, Os

Web App (**JavaScript & HTML**):
- **Leaflet**: [https://leafletjs.com/](https://leafletjs.com/)
    - Leaflet.heat: https://github.com/Leaflet/Leaflet.heat
    - GeometryUtil: https://github.com/makinacorpus/Leaflet.GeometryUtil
    - Arrowheads: https://github.com/slutske22/leaflet-arrowheads
    - SvgShapeMarkers: https://github.com/rowanwins/Leaflet.SvgShapeMarkers
- **Plotly:** https://github.com/plotly/plotly.js
- **D3:** https://github.com/d3/d3
- **Bootstrap:** https://github.com/twbs/bootstrap

## Data Sources
- **Storm Event Data**: [NOAA Storm Events Database](https://www.ncdc.noaa.gov/stormevents/)
- **GeoJson Counties FIPS**: [Plotly datasets](https://github.com/plotly/datasets/blob/master/geojson-counties-fips.json)
- **Census County FIPS**: [Census Codes for Counties & County Equivalent Entities](https://www.census.gov/library/reference/code-lists/ansi.html)

## Ethicial Consideration  
This project has no ethical concerns since it is based on a publicly available dataset, ensuring transparency and accessibility of the data used. As the dataset is open to public use and does not contain personally identifiable or sensitive information, no ethical concerns were identified in its application.

// define url
// const baseURL = 'https://bmitri.pythonanywhere.com/api/v1.0/';
const baseURL = 'http://127.0.0.1:5000/api/v1.0/';
const optionsURL = baseURL + 'options';
const countiesURL = baseURL + 'counties';
const dashboardURL = baseURL + 'dashboard';
const eventsURL = baseURL + 'events';

// store entire counties
let allCounties = [];

// map/leaflet variables
let map;  //map instance
let layerControl;  //for toggling overlays

let countyLayer;  //county heatmap layer
let eventsLayer;  //marker layer for events
let heatLayer;  // heatmap layer for events
let usCountiesGeoJSON;  //loaded county boundaries

// events data
let eventsDataFetched = false;  //track if we've fetched events data
let allEventsData = null;  //store all events data globally
let monthlyData = null; // store monthly data to switch between

// flags to check if each extra map layer is already built
let eventsLayerBuilt = false;
let eventsHeatLayerBuilt = false;

// store references for events marker arrays 
let beginMarkers = [];
let endMarkers = [];
// layer groups to show/hid events markers
let beginLayerGroup;
let endLayerGroup;


// add dictionary for state
const stateToFIPS = {
    AL: '01', AK: '02', AZ: '04', AR: '05', CA: '06', CO: '08', CT: '09',
    DE: '10', DC: '11', FL: '12', GA: '13', HI: '15', ID: '16', IL: '17',
    IN: '18', IA: '19', KS: '20', KY: '21', LA: '22', ME: '23', MD: '24',
    MA: '25', MI: '26', MN: '27', MS: '28', MO: '29', MT: '30', NE: '31',
    NV: '32', NH: '33', NJ: '34', NM: '35', NY: '36', NC: '37', ND: '38',
    OH: '39', OK: '40', OR: '41', PA: '42', RI: '44', SC: '45', SD: '46',
    TN: '47', TX: '48', UT: '49', VT: '50', VA: '51', WA: '53', WV: '54',
    WI: '55', WY: '56'
  };

/*****************************************
 * DOM References
 *****************************************/
// for dropdown
const dashboardForm = document.getElementById('dashboardForm');
const startYearDropdown = document.getElementById('startYearDropdown');
const durationDropdown = document.getElementById('durationDropdown');
const stateDropdown = document.getElementById('stateDropdown');
const countyDropdown = document.getElementById('countyDropdown');
const totalsDropdown = document.getElementById('totalsDropdown');

// for "generating" message
const generatingText = document.getElementById('generating-text');

// for visualizations
const heatmapDiv = document.getElementById('heatmap');
const durationTable = document.getElementById('durationTable');
const totalsTable = document.getElementById('totalsTable');
const scalePieChart = document.getElementById('scalePieChart');
const monthlyEventsChart = document.getElementById('monthlyEventsChart');

/*****************************************
 * Populate drowpdown options function
 *****************************************/
// for non county dropdowns
function populateDropdown(selectElement, items, placeholder) {
    // clear existing options
    selectElement.innerHTML = '';

    // add placeholder option
    let placeholderOption = document.createElement('option');
    placeholderOption.value = '';
    placeholderOption.textContent = placeholder;
    selectElement.appendChild(placeholderOption);

    // add dropdown options
    items.forEach((item) => {
        let option = document.createElement('option');
        option.value = item;
        option.textContent = item;
        selectElement.appendChild(option);
    });
}

// for county
function populateCountyDropdown(selectElement, items, placeholder) {
    // clear existing options
    selectElement.innerHTML = '';

    // add placeholder option
    let placeholderOption = document.createElement('option');
    placeholderOption.value = '';
    placeholderOption.textContent = placeholder;
    selectElement.appendChild(placeholderOption);

    // add each county
    items.forEach((item) => {
        let option = document.createElement('option');
        option.value = item.FIPS;  //fips code (hidden value)
        option.textContent = item.COUNTYNAME;  //display name
        selectElement.appendChild(option);
    });
}

/**********************************************
 * Initialize heatmap function
 *********************************************/
function initMap() {
    // create map in heatmapDiv centered on US (zoom 4)
    map = L.map('heatmap').setView([37.8, -96], 4);

    // add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: "© OpenStreetMap contributors"
    }).addTo(map);

    // create layer control with no overlays yet
    layerControl = L.control.layers(null, null, {collapsed: false}).addTo(map);

    // create an empty events layer and add it as an overlay (as a toggle option)
    eventsLayer = L.layerGroup();
    layerControl.addOverlay(eventsLayer, 'Events');

    // create an empty heat layer and add it as a overlay toggle option
    heatLayer = L.layerGroup();
    layerControl.addOverlay(heatLayer, 'Heatmap');

    // listen for overlay toggles --> event data fetch doesn't happen until this
    map.on('overlayadd', function(e) {
        //user toggled on 'Events' overlay
        if (e.name === 'Events') {
          getEventsData().then(data => buildEventsLayer(data));  //only builds layer once
        }
        // user toggled on 'Heatmap' overlay
        if (e.name === 'Heatmap') {
          getEventsData().then(data => buildEventsHeatLayer(data));  //only builds layer once
        }
      });
}

/**********************************************
 * Map zoom to state selection function
 *********************************************/
function zoomToState(numericStateCode) {
    if(!numericStateCode) {
        // zoom to entire us if no match
        map.setView([37.8, -96], 4);
        return;
    }

    // filter features to just that one state
    let matchingFeatures = usCountiesGeoJSON.features.filter((feature) => {
        return feature.properties.STATE == numericStateCode;
    });

    if (matchingFeatures.length == 0) {
        // zoom to entire us if no match
        map.setView([37.8, -96], 4);
        return;
    }

    // create temporary layer to get bounds
    let tempLayer = L.geoJSON(matchingFeatures);
    map.fitBounds(tempLayer.getBounds());
    tempLayer.remove();
}

/**********************************************
 * Initialize dash/Fetch options (on page load)
 *********************************************/
window.addEventListener('DOMContentLoaded', () => {
    // initialize Leaflet map
    initMap();

    // fetch county GeoJSON
    fetch('./static/js/data/geojson-counties-fips.json')
        .then((res) => res.json())
        .then((geoData) => {
            // store geoJSON globally
            usCountiesGeoJSON = geoData;
        })
        .catch((err) => console.error('Error fetching GeoJSON:', err));
    
    // fetch options route for years and states
    fetch(optionsURL)
        .then((res) => res.json())
        .then((data) => {
            // populate start year and state dropdowns
            populateDropdown(startYearDropdown, data.years, 'Select...');
            populateDropdown(stateDropdown, data.states, 'All');
            
            // find latest year
            let latestYear = Math.max(...data.years);

            // initialize dashboard
            refreshDashboard(latestYear, 1);
        })
        .catch((err) => console.error('Error fetching options', err));

    // fetch counties route from api
    fetch(countiesURL)
        .then((res) => res.json())
        .then((counties) => {
            // populate counties array --> [{FIPS, COUNTYNAME, STATE},..]
            allCounties = counties;
        })
        .catch((err) => console.error('Error fetching counties', err));


    // hardcode duration dropdown options (1-10 years)
    const durations = Array.from({length:10}, (_, i) => i + 1);
    populateDropdown(durationDropdown, durations, 'Select...');
});

/*****************************************
 * Filter counties dropdown based on state
 *****************************************/
stateDropdown.addEventListener('change', () => {
    // capture selected state
    let selectedState = stateDropdown.value;
    if (!selectedState) {
        // reset county dropdown if user cleared selection
        countyDropdown.innerHTML = "<option value=''>All</option>";
        return;
    }

    // filter counties based on state
    let filtered = allCounties.filter(
        (c) => c.STATE == selectedState
    );

    // convert to a list of just county names & populate dropdown
    populateCountyDropdown(countyDropdown, filtered, 'All');

});

/********************************************
 * Change bar chart metric based on dropdown
 ********************************************/
totalsDropdown.addEventListener('change', () => {
    buildMonthlyEventsChart(monthlyData);
});


/*****************************************
 * County Heatmap: Functions
 *****************************************/
// county heatmap
function buildCountyHeatmap(countyHeatMapData) {
    // build lookup from dashbaord api call data
    let lookup = {};
    let countyLookup = {};
    let stateLookup = {};

    countyHeatMapData.forEach((item) => {
        lookup[item.fip] = item.count;
        countyLookup[item.fip] = item.name;
        stateLookup[item.fip] = item.state;
    });

    // remove old layer if there
    if (countyLayer) {
        map.removeLayer(countyLayer);
        layerControl.removeLayer(countyLayer);
    }

    // create a new GeoJSON layer
    countyLayer = L.geoJSON(usCountiesGeoJSON, {
        style: function(feature) {
            let fip = feature.id;
            let count = lookup[fip] || 0; //get 0 if not found
            return {
                fillColor: getCountyHeatmapColor(count),
                color: '#999',
                weight: 1,
                fillOpacity: 0.7
            };
        },
        onEachFeature: function(feature, layer) {
            // define popups
            let fip = feature.id;
            let count = lookup[fip] || 0;
            let countyName = countyLookup[fip] || "";
            let stateName = stateLookup[fip] || "";
            let comma = ", ";
            if (countyName == "" || stateName == "")
                comma = "";

            layer.bindPopup(`${countyName}${comma}${stateName}<br>${count} Events`);
        }
    });

    // add layer to map
    countyLayer.addTo(map);
    layerControl.addOverlay(countyLayer, 'Counties');
}

// heatmap color scale
function getCountyHeatmapColor(count) {
    // breakpoints
    if (count > 20) return "#800026";
    if (count > 10) return "#BD0026";
    if (count > 5)  return "#E31A1C";
    if (count > 2)  return "#FC4E2A";
    if (count > 0)  return "#FD8D3C";
    return "#EEEEE";
}

/*****************************************
 * Events Map: Functions
 *****************************************/
// events layer map
function buildEventsLayer(eventsData) {

    // if we already built this layer, do nothing
    if (eventsLayerBuilt) return;

    // Clear old or create new if it doesn't exist
    eventsLayer.clearLayers();
    beginMarkers = [];
    endMarkers = [];

    // recreate fresh layer groups
    beginLayerGroup = L.layerGroup();
    endLayerGroup = L.layerGroup();
  
    // build markers
    for (let i = 0; i < eventsData.length; i++) {
      let tornado = eventsData[i];
      if (tornado.BEGIN_LAT) {
        let color = colorScale[tornado.TOR_F_LEVEL];
        let beginCoord = [tornado.BEGIN_LAT, tornado.BEGIN_LON];
        let beginMarker = L.shapeMarker(beginCoord, {
          title: `${tornado.TOR_F_SCALE} Begin Point`,
          zIndexOffset: 100,
          shape: "triangle-down",
          radius: getMarkerSize(map.getZoom(), true),
          color: "black",
          weight: 1,
          fillColor: color,
          fillOpacity: 0.8
        }).bindPopup(createPopup(tornado, true), {
            maxWidth: 650,
            maxHeight: 400
        });
        beginMarkers.push(beginMarker);
  
        if (tornado.END_LAT) {
          let endCoord = [tornado.END_LAT, tornado.END_LON];
          if (endCoord[0] !== beginCoord[0] || endCoord[1] !== beginCoord[1]) {
            let endMarker = L.shapeMarker(endCoord, {
              title: `${tornado.TOR_F_SCALE} End Point`,
              zIndexOffset: -100,
              shape: "square",
              radius: getMarkerSize(map.getZoom(), false),
              color: "black",
              weight: 1,
              fillColor: color,
              fillOpacity: 0.8
            }).bindPopup(createPopup(tornado, false), {
                maxWidth: 650,
                maxHeight: 400
            });
            endMarkers.push(endMarker);
            
            // path
            let pathLine = L.polyline([beginCoord, endCoord], {
              stroke: false,
              color: color
            }).arrowheads({
              yawn: 40,
              size: "10%",
              frequency: 10,
              fill: true,
              fillColor: color
            });
            endMarkers.push(pathLine);
          }
        }
      }
    }
    
    // add markers to layer groups
    beginLayerGroup = L.layerGroup(beginMarkers);
    endLayerGroup = L.layerGroup(endMarkers);
    
    // add both to eventsLayer
    eventsLayer.addLayer(beginLayerGroup);
    eventsLayer.addLayer(endLayerGroup);

    // track that this layer is now built
    eventsLayerBuilt = true;
  
    // Attach zoom handler for resizing
    map.on("zoomend", markersZoom);
    markersZoom();
}

// color scale for events
let colorScale = {
    "0": "#00FFFF", // CYAN
    "1": "#00FF00", // GREEN
    "2": "#FFFF00", // YELLOW
    "3": "#FFA500", // ORANGE
    "4": "#FF0000", // RED
    "5": "#4B0082", // INDIGO
    "U": "#D3D3D3"  // GRAY
};

// functions for events layer
function markersZoom() {
  let z = map.getZoom();
  // threshold if you want to hide end markers at low zoom
  let threshold = 8;
  
  // Hide endLayerGroup if zoom < threshold
  if (z < threshold) {
    if (eventsLayer.hasLayer(endLayerGroup)) {
      eventsLayer.removeLayer(endLayerGroup);
    }
  } else {
    if (!eventsLayer.hasLayer(endLayerGroup)) {
      eventsLayer.addLayer(endLayerGroup);
    }
  }

  // resize markers
  beginMarkers.forEach((mk) => {
    mk.setRadius(getMarkerSize(z, true));
  });

  endMarkers.forEach((mk) => {
    // if it's a shapeMarker the setradius
    if (mk.options && mk.setRadius) {
      mk.setRadius(getMarkerSize(z, false));
    }
  });
}

function getMarkerSize(zoom, isBegin) {
    let multiplier = 0.5;
    if (isBegin) multiplier *= 2;
    return zoom * multiplier;
  }

function createPopup(tornado, isBegin) {
    let html = "";
    let mileText = "mile";

    if (isBegin) {
        let timestamp = Number(tornado.BEGIN_TIMESTAMP)
        let beginDate = new Date(timestamp * 1000).toUTCString();
        html +=
        `<h2>${tornado.TOR_F_SCALE} Tornado (Begin Point)</h2>
        ${formatRAP(tornado.BEGIN_RANGE, tornado.BEGIN_AZIMUTH, tornado.BEGIN_LOCATION, tornado.STATE)}
        <br>${beginDate}`;
    }
    else {
        let timestamp = Number(tornado.BEGIN_TIMESTAMP)
        let endDate = new Date(timestamp * 1000).toUTCString();
        html +=
        `<h2>${tornado.TOR_F_SCALE} Tornado (End Point)</h2>
        ${formatRAP(tornado.END_RANGE, tornado.END_AZIMUTH, tornado.END_LOCATION, tornado.STATE)}
        <br>${endDate}`;
    }

    let length = Number.parseFloat(tornado.TOR_LENGTH).toPrecision(2)
    if (length !== 1)
        mileText += "s";

    html +=
        `<hr>Length: ${length} ${mileText}
        <br>Width: ${tornado.TOR_WIDTH} yards
        <hr>Deaths: ${tornado.DEATHS}
        <br>Injuries: ${tornado.INJURIES}
        <br>Property Damage: $${tornado.DAMAGE_PROPERTY.toLocaleString()}
        <br>Crop Damage: $${tornado.DAMAGE_CROPS.toLocaleString()}`

    if (tornado.EVENT_NARRATIVE) {
        html += `<hr>${tornado.EVENT_NARRATIVE}`;        
    }        

    return html;
  }

function formatRAP(range, azimuth, location, state) {
    let html = "";
    let mileText = "mile";

    if (state) {
        if (location) {
            if (range) {
                if (range !== 1)
                    mileText += "s";
                html += `${range} ${mileText} `;
            }
        
            if (azimuth)
                html += `${azimuth} of `;
            else
                html += `Near `;
    
            html += `${location}, `;
        }
        html += state;
    }
    return html;
}

/*****************************************
 * Heat Events Map: Function
 *****************************************/
function buildEventsHeatLayer(eventsData) {
    // do nothing if layer already built
    if (eventsHeatLayerBuilt) return;

    // clear old or create new if it doesn't exits
    heatLayer.clearLayers();

    // filter/map data for leaflet.heat
    let heatData = eventsData
        .filter(entry => entry.BEGIN_LAT && entry.BEGIN_LON)
        .map(entry => ([
            parseFloat(entry.BEGIN_LAT),
            parseFloat(entry.BEGIN_LON),
            1  //intensity
        ]));
    
    // Create and add the heatmap layer
    let eventsHeatSubLayer = L.heatLayer(heatData, {
        radius: 25, 
        blur: 15,
        minOpacity: 0.3,    
        maxZoom: 10
        // gradient: {
        //     0.1: 'blue',
        //     0.4: 'lime',
        //     0.7: 'orange',
        //     1.0: 'red'
        // }  
    });

    // add to our group
    heatLayer.addLayer(eventsHeatSubLayer);

    // mark as built
    eventsHeatLayerBuilt = true;
}

/*****************************************
 * Functions to build visualizations/tables
 *****************************************/
function buildDurationTable(durationData) {
    // clear existing
    durationTable.innerHTML = '';

    // build two row table
    let html = `
        <thead>
            <tr>
                <th>Metric</th>
                <th>Value</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Total Time</td>
                <td>${durationData.total_hrs.toLocaleString()} hours</td>
            </tr>
            <tr>
                <td>Average Time Per Event</td>
                <td>${(durationData.avg_hrs_per_event * 60).toLocaleString()} minutes</td>
            </tr>
        </tbody>
    `;
    durationTable.innerHTML = html;
}

function buildTotalsTable(summaryData) {
    // clear existing
    totalsTable.innerHTML = '';

    // create name per key
    let rowMap = {
        events: 'Events',
        deaths: 'Deaths',
        injuries: 'Injuries',        
        damaged_property: 'Property Damage',
        damaged_crops: 'Crop Damage'
    };

    // build table
    let html = `
        <thead>
            <tr>
                <th>Metric</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody>
    `;
    for (let key in rowMap) {
        let label = rowMap[key];
        let units = "";
        // grabbing total value
        let totalValue = summaryData[key]?.total ?? 0;
        if (key.includes("damage"))
            units = "$";
        html += `
            <tr>
                <td>${label}</td>
                <td>${units}${totalValue.toLocaleString()}</td>
            </tr>
        `
    }
    html += '</tbody>';
    totalsTable.innerHTML = html;
}

function buildPieChart(scaleData) {
    // Extract labels (scales) and values (counts)
    let labels = scaleData.map((entry) => entry.scale);
    let values = scaleData.map((entry) => entry.count);

    // reference colorScale for consistency
    let colorMap = {
        "EFU/FU": colorScale["U"],
        "EF0/F0": colorScale["0"],
        "EF1/F1": colorScale["1"],
        "EF2/F2": colorScale["2"],
        "EF3/F3": colorScale["3"],
        "EF4/F4": colorScale["4"],
        "EF5/F5": colorScale["5"]
    };

    // Assign colors by labels
    let colors = labels.map(label => colorMap[label]); 
       
    // Create Pie Chart Data
    let pieData = [{
        labels: labels,
        values: values,
        type: 'pie',
        textinfo: 'label+percent',
        insidetextorientation: 'radial',
        marker: {colors: colors},
        sort: false
    }];

    // Define Layout
    let layout = {
        // height: 400,
        // width: 400
        margin: { t: 40, b: 40}, // top/bottom margin in px
        // legend: { orientation: 'h' }
    };

    // Render Pie Chart inside the correct div
    Plotly.newPlot('scalePieChart', pieData, layout, {responsive: true});
}
function buildMonthlyEventsChart(monthlyEventsData) {
    // create x axis labels (YYYY-MM) and y axis counts arrays
    let xValues = monthlyEventsData.map((item) => `${item.year}-${item.month}`);

    // Default to event count
    let yValues = monthlyEventsData.map((item) => item.count);
    let units = "Count";
    switch (totalsDropdown.value) {
        case 'Deaths':
            yValues = monthlyEventsData.map((item) => item.deaths);
            break;
        case 'Injuries':
            yValues = monthlyEventsData.map((item) => item.injuries);
            break;
        case 'Property Damage':
            yValues = monthlyEventsData.map((item) => item.propdmg);
            units = "($)"
            break;
        case 'Crop Damage':
            yValues = monthlyEventsData.map((item) => item.cropdmg);
            units = "(%)"
            break;
    }


    // setup trace
    let trace = {
        x: xValues,
        y: yValues,
        type: 'bar'
    };

    // define layout
    let layout = {
        yaxis: {title: `${totalsDropdown.value} ${units}`}
    };

    // plot chart
    Plotly.newPlot(monthlyEventsChart, [trace], layout, {responsive: true});
}

/**********************************************
 * Build api url function
 *********************************************/
function buildApiUrl(url) {

    // collect values
    let startYear = startYearDropdown.value;
    let duration = durationDropdown.value;
    let stateAbbr = stateDropdown.value;
    let fip = countyDropdown.value;

    // validate required fields
    if (!startYear || !duration) {
        alert('Please select BOTH start year and duration :)');
        return {finalURL: null, stateAbbr, fip};
    }

    // build final dashboard url api call
    //required endpoints
    let params = new URLSearchParams({
        start_year: startYear,
        duration: duration
    });

    // optional endpoints
    if (stateAbbr) {
        params.append('state', stateAbbr);
    }
    if (fip) {
        params.append('fip', fip);
    }

    // final API URL
    let finalURL = `${url}?${params.toString()}`;
    return finalURL;
}

/*****************************************
 * Initialize/refresh dashboard function
 *****************************************/
function refreshDashboard(forceYear, forceDuration) {

    /*****************************************
     * Build api url
     *****************************************/
    // initialize dashboard values (if provided override dropdowns time values)
    if (forceYear !== undefined) {
        startYearDropdown.value = forceYear;
    }
    if (forceDuration !== undefined) {
        durationDropdown.value = forceDuration;
    }

    // collect stateAbbr for zoom
    let stateAbbr = stateDropdown.value;
    let numericStateCode = stateToFIPS[stateAbbr];

    // // final API URL
    let finalURL = buildApiUrl(dashboardURL);
    console.log('Dashboard URL:', finalURL);

    /*****************************************
     * Reset the events data so it will fetch again
     *****************************************/
    allEventsData = null;
    eventsDataFetched = false;

    /*****************************************
     * Force turning off 'Events' overlay if on
     *****************************************/
    if (map.hasLayer(eventsLayer)) {
        // visually uncheck control
        map.removeLayer(eventsLayer);
    }
    
    // clear/reset build flag
    eventsLayer.clearLayers();
    eventsLayerBuilt = false;

    /*****************************************
     * Force turning off 'Heatmap' overlay if on
     *****************************************/
    if (map.hasLayer(heatLayer)) {
        // visually uncheck control
        map.removeLayer(heatLayer);
    }
    
    // clear/reset build flag
    heatLayer.clearLayers();
    eventsHeatLayerBuilt = false;

    /*****************************************
     * Build visualizations/tables
     *****************************************/
    // fetch data
    d3.json(finalURL).then(data => {
        // console log api data
        console.log('Dashboard data:', data);

        // zoom the map (if state is chosen)
        //let numericStateCode = stateToFIPS[stateAbbr];
        zoomToState(numericStateCode);

        // build visualizations
        buildCountyHeatmap(data.county_heatmap);
        buildDurationTable(data.duration_table);
        buildTotalsTable(data.summary_table);
        buildPieChart(data.scale_pie);
        monthlyData = data.monthly_events_chart;
        buildMonthlyEventsChart(monthlyData);
        generatingMessage(false);
    })
    .catch((err) => console.error(err));
}

/*****************************************
 * Generate button
 *****************************************/
dashboardForm.addEventListener('submit', function (event) {
    generatingMessage(true);

    // prevent page reload
    event.preventDefault();

    // load dashboard
    refreshDashboard();
});

/*****************************************
* Fetch events data
*****************************************/
// fetch events api route data
function getEventsData() {

    // if data is already fetched, return it
    if (allEventsData) {
        return Promise.resolve(allEventsData);
    }

    // otherwise, build api url for events
    generatingMessage(true);
    let finalURL = buildApiUrl(eventsURL);
    console.log("Fetching events from:", finalURL);
    
    // fetch data
    return d3.json(finalURL).then(data => {
        console.log('Events data fetched:', data.length, 'records');
        allEventsData = data;  //store in global
        eventsDataFetched = true;  //mark as fetched
        generatingMessage(false);
        return data;  // return data        
    })
    .catch((err) => {console.error('Error fetching events data:', err)});
}

function generatingMessage(on) {
    if (on)
        generatingText.innerHTML = "<strong>Generating, please wait...</strong>";
    else
        generatingText.innerHTML = "";
}
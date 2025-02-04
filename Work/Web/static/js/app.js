// define url
const baseURL = 'https://bmitri.pythonanywhere.com/api/v1.0/';
const optionsURL = baseURL + 'options';
const countiesURL = baseURL + 'counties';
const dashboardURL = baseURL + 'dashboard';

// store entire counties
let allCounties = [];

/*****************************************
 * DOM References
 *****************************************/
// for dropdown
const dashboardForm = document.getElementById('dashboardForm');
const startYearDropdown = document.getElementById('startYearDropdown');
const durationDropdown = document.getElementById('durationDropdown');
const stateDropdown = document.getElementById('stateDropdown');
const countyDropdown = document.getElementById('countyDropdown');

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
// leaflet variables
let map;  //map instance
let countyLayer;  //curent GeoJSON layer
let usCountiesGeoJSON;  //loaded county boundaries

function initMap() {
    // create map in heatmapDiv centered on US (zoom 4)
    map = L.map('heatmap').setView([37.8, -96], 4);

    // add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: "© OpenStreetMap contributors"
    }).addTo(map);
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
            populateDropdown(stateDropdown, data.states, 'Select...');
            
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
        countyDropdown.innerHTML = "<option value=''>Select a State first...</option>";
        return;
    }

    // filter counties based on state
    let filtered = allCounties.filter(
        (c) => c.STATE == selectedState
    );

    // convert to a list of just county names & populate dropdown
    populateCountyDropdown(countyDropdown, filtered, 'Select...');

});

/*****************************************
 * Functions to build visualizations/tables
 *****************************************/
function buildHeatmap(countyHeatMapData) {
    // build lookup from dashbaord api call data
    let lookup = {};
    countyHeatMapData.forEach((item) => {
        lookup[item.fip] = item.count;
    });

    // remove old layer if there
    if (countyLayer) {
        map.removeLayer(countyLayer);
    }

    // create a new GeoJSON layer
    countyLayer = L.geoJSON(usCountiesGeoJSON, {
        style: function(feature) {
            let fip = feature.id;
            let count = lookup[fip] || 0; //get 0 if not found
            return {
                fillColor: getColor(count),
                color: '#999',
                weight: 1,
                fillOpacity: 0.7
            };
        },
        onEachFeature: function(feature, layer) {
            // define popups
            let fip = feature.id;
            let count = lookup[fip] || 0;
            layer.bindPopup(`Count: ${count}`);
        }
    });

    // add layer to map
    countyLayer.addTo(map);

}

// heatmap color scale
function getColor(count) {
    // breakpoints
    if (count > 20) return "#800026";
    if (count > 10) return "#BD0026";
    if (count > 5)  return "#E31A1C";
    if (count > 2)  return "#FC4E2A";
    if (count > 0)  return "#FD8D3C";
    return "#EEEEE";
}

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
                <td>Total Hours</td>
                <td>${durationData.total_hrs.toLocaleString()}</td>
            </tr>
            <tr>
                <td>Avg Hours Per Event</td>
                <td>${durationData.avg_hrs_per_event.toLocaleString()}</td>
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
        damaged_crops: 'Damaged Crops ($)',
        damaged_property: 'Damaged Property ($)'
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
        // grabbing total value
        let totalValue = summaryData[key]?.total ?? 0;
        html += `
            <tr>
                <td>${label}</td>
                <td>${totalValue.toLocaleString()}</td>
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

    // Create Pie Chart Data
    let pieData = [{
        labels: labels,
        values: values,
        type: 'pie',
        textinfo: 'label+percent',
        insidetextorientation: 'radial'
    }];

    // Define Layout
    let layout = {
        // height: 400,
        // width: 400
        margin: { t: 40, b: 40} // top/bottom margin in px
        // legend: { orientation: 'h' }
    };

    // Render Pie Chart inside the correct div
    Plotly.newPlot('scalePieChart', pieData, layout, {responsive: true});
}
function buildMonthlyEventsChart(monthlyEventsData) {
    // create x axis labels (YYYY-MM) and y axis counts arrays
    let xValues = monthlyEventsData.map((item) => `${item.year}-${item.month}`);
    let yValues = monthlyEventsData.map((item) => item.count);

    // setup trace
    let trace = {
        x: xValues,
        y: yValues,
        type: 'bar'
    };

    // define layout
    let layout = {
        yaxis: {title: 'Event Count'}
    };

    // plot chart
    Plotly.newPlot(monthlyEventsChart, [trace], layout, {responsive: true});
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

    // collect values
    let startYear = startYearDropdown.value;
    let duration = durationDropdown.value;
    let state = stateDropdown.value;
    let fip = countyDropdown.value;

    // validate required fields
    if (!startYear || !duration) {
        alert('Please select BOTH start year and duration :)');
        return;
    }

    // build final dashboard url api call
    //required endpoints
    let params = new URLSearchParams({
        start_year: startYear,
        duration: duration
    });

    // optional endpoints
    if (state) {
        params.append('state', state);
    }
    if (fip) {
        params.append('fip', fip);
    }

    // final API URL
    const finalURL = `${dashboardURL}?${params.toString()}`;
    console.log('Dashboard URL:', finalURL);

    /*****************************************
     * Build visualizations/tables
     *****************************************/
    // fetch data
    d3.json(finalURL).then(data => {
        // console log api data
        console.log('API data:', data);

        // build visualizations
        buildHeatmap(data.county_heatmap);
        buildDurationTable(data.duration_table);
        buildTotalsTable(data.summary_table);
        buildPieChart(data.scale_pie);
        buildMonthlyEventsChart(data.monthly_events_chart);
    })
    .catch((err) => console.error(err));
}

/*****************************************
 * Generate button
 *****************************************/
dashboardForm.addEventListener('submit', function (event) {
    
    // prevent page reload
    event.preventDefault();

    // load dashboard
    refreshDashboard();
});

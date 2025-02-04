// let api_call = "http://127.0.0.1:5000/api/v1.0/events?start_year=2020&duration=1"
// let api_call = "https://bmitri.pythonanywhere.com/api/v1.0/events?start_year=2015&duration=5"

let eventMapURL = baseURL + 'events';

let EFscale = ["U", "0", "1", "2", "3", "4", "5"];

let colorScale = {
    "U": "white",
    "0": "cyan",
    "1": "green",
    "2": "yellow",
    "3": "orange",
    "4": "red",
    "5": "black"
};

let street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

// let topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
//     attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
// });

let view = {
    center: [37.09, -95.71],
    zoom: 5,
    endPointThreshold: 8
};

let baseMaps = {
    "Street": street
    // "Topographic": topo
};

let beginMarkers = [];
let endMarkers = [];

// let beginMarkers = {
//     "U": [],
//     "0": [],
//     "1": [],
//     "2": [],
//     "3": [],
//     "4": [],
//     "5": []
// };

// let endMarkers = {
//     "U": [],
//     "0": [],
//     "1": [],
//     "2": [],
//     "3": [],
//     "4": [],
//     "5": []
// };

let beginLayerGroup = L.layerGroup();
let endLayerGroup = L.layerGroup();

let overlays = {
    "Begin Points": beginLayerGroup,
    "End Points": endLayerGroup
}

let tornadoMap = L.map("map", {
    center: view.center,
    zoom: view.zoom,
    layers: [street]
});

// let mapLayerControl = L.control.layers(baseMaps, null, {
//     collapsed: true
// }).addTo(tornadoMap);

tornadoMap.on("zoomend", markersZoom);
populateMap();

// let tornadoURL = api_call;
// let eventMapLayers = [];


dashboardForm.addEventListener('submit', function (event) {
    
    // prevent page reload
    event.preventDefault();

    // load dashboard
    // refreshDashboard();    
    populateMap();
});

function populateMap() {    
    // collect values
    const startYear = startYearDropdown.value;
    const duration = durationDropdown.value;
    const state = stateDropdown.value;
    const fip = countyDropdown.value;

    // validate required fields
    if (!startYear || !duration) {
        // alert('Please select BOTH start year and duration :)');
        return;
    }

    // console.log("Populate Map");

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
    const finalURL = `${eventMapURL}?${params.toString()}`;
    // console.log('Dashboard URL:', finalURL);
    console.log('Map URL: ', finalURL);

    d3.json(finalURL).then(response => {
        beginMarkers.length = 0;
        endMarkers.length = 0;
        // resetMarkers();

        for (let i = 0; i < response.length; i++) {
            let tornado = response[i];
            if (tornado.BEGIN_LAT) {
                let color = colorScale[tornado.TOR_F_LEVEL];
                let beginCoordinates = [tornado.BEGIN_LAT, tornado.BEGIN_LON];                
                let beginMarker = L.shapeMarker(beginCoordinates, {
                    title: `${tornado.TOR_F_SCALE} Begin Point`,
                    zIndexOffset: 100,
                    shape: "triangle-down",
                    radius: getMarkerSize(view.zoom, true),                    
                    color: "black",
                    weight: 1,
                    fillColor: color,
                    fillOpacity: 0.8
                } ).bindPopup(createPopup(tornado, true), {
                    maxWidth: 650,
                    maxHeight: 400
                });
                beginMarkers.push(beginMarker);
                // beginMarkers[tornado.TOR_F_LEVEL].push(beginMarker);
    
                if (tornado.END_LAT) {
                    let endCoordinates = [tornado.END_LAT, tornado.END_LON];
                    if (beginCoordinates != endCoordinates) {
                        let endMarker = L.shapeMarker(endCoordinates, {
                            title: `${tornado.TOR_F_SCALE} End Point`,
                            zIndexOffset: -100,
                            shape: "square",
                            radius: getMarkerSize(view.zoom, false),
                            color: "black",
                            weight: 1,
                            fillColor: color,
                            fillOpacity: 0.8
                        } ).bindPopup(createPopup(tornado, false), {
                            maxWidth: 650,
                            maxHeight: 400
                        });
                        endMarkers.push(endMarker);
                        // endMarkers[tornado.TOR_F_LEVEL].push(endMarker);
        
                        // Calculate size & frequency based on tornado length?
                        let pathMarkerFrequency = 10;
                        let pathMarkerSize = "10%";
        
                        // Path between BEGIN and END points
                        let tornadoPath = L.polyline([
                            [tornado.BEGIN_LAT, tornado.BEGIN_LON],
                            [tornado.END_LAT, tornado.END_LON]
                        ], {
                            stroke: false,
                            color: color,
                            zIndexOffset: -200
                        }).arrowheads({                        
                            yawn: 40,
                            size: pathMarkerSize,
                            frequency: pathMarkerFrequency,
                            proportionalToTotal: false,
                            fill: true,                        
                            fillColor: color
                        });
                        endMarkers.push(tornadoPath);
                        // endMarkers[tornado.TOR_F_LEVEL].push(tornadoPath);
                    }
                }
            }
        }

        tornadoMap.removeLayer(beginLayerGroup);
        tornadoMap.removeLayer(endLayerGroup);

        beginLayerGroup = L.layerGroup(beginMarkers);
        endLayerGroup = L.layerGroup(endMarkers);
        // beginLayerGroup = L.layerGroup();
        // endLayerGroup = L.layerGroup();

        // for (let i = 0; i < EFscale.length; i++) {
        //     let ef = EFscale[i];
        //     if (beginMarkers[ef].length > 0)
        //         beginLayerGroup.addLayer(beginMarkers[ef]);
        //     if (endMarkers[ef].length > 0)
        //         endLayerGroup.addLayer(endMarkers[ef]);
        // }

        tornadoMap.addLayer(beginLayerGroup);
        tornadoMap.addLayer(endLayerGroup);

        markersZoom();        
    });
}

function resetMarkers() {
    for (let i = 0; i < EFscale.length; i++) {
        let element = EFscale[i];
        console.log(element);
        beginMarkers[element].length = 0;
        endMarkers[element].length = 0;
    }
 }

function markersZoom() {
        // console.log(tornadoMap.getZoom());
        // console.log(getMarkerSize(tornadoMap.getZoom(), true));

        if (tornadoMap.getZoom() < view.endPointThreshold) {
            if (tornadoMap.hasLayer(endLayerGroup))
                tornadoMap.removeLayer(endLayerGroup);
        }
        else {
            if (!tornadoMap.hasLayer(endLayerGroup))
                tornadoMap.addLayer(endLayerGroup);
        }

        // for (let i = 0; i < EFscale.length; i++) {
        //     let element = EFscale[i];
        //     resizeMarkers(element);
        // }
        resizeMarkers();
}

// function resizeMarkers(fScale) {
function resizeMarkers() {
    beginMarkers.forEach(element => {
        element.setRadius(getMarkerSize(tornadoMap.getZoom(), true));
    });
    for (let i = 0; i < endMarkers.length; i++) {
        let element = endMarkers[i];
        if ((i % 2) === 0) {
            // This is a marker
            element.setRadius(getMarkerSize(tornadoMap.getZoom(), false));
        }
        else {
            // This is a path

        }
    }    
}

function getMarkerSize(currentZoom, isBegin) {
    let multiplier = 0.5;
    if (isBegin)
        multiplier *= 2;
    return currentZoom * multiplier;
}

function createPopup(tornado, isBegin) {
    let text = "";
    let mileText = "mile";

    if (isBegin) {
        let timestamp = Number(tornado.BEGIN_TIMESTAMP)
        let beginDate = new Date(timestamp * 1000).toUTCString();
        text +=
        `<h2>${tornado.TOR_F_SCALE} Tornado (Begin Point)</h2>
        ${formatRAP(tornado.BEGIN_RANGE, tornado.BEGIN_AZIMUTH, tornado.BEGIN_LOCATION)}, ${tornado.STATE}
        <br>${beginDate}`;
    }
    else {
        let timestamp = Number(tornado.BEGIN_TIMESTAMP)
        let endDate = new Date(timestamp * 1000).toUTCString();
        text +=
        `<h2>${tornado.TOR_F_SCALE} Tornado (End Point)</h2>
        ${formatRAP(tornado.END_RANGE, tornado.END_AZIMUTH, tornado.END_LOCATION)}, ${tornado.STATE}
        <br>${endDate}`;
    }

    let length = Number.parseFloat(tornado.TOR_LENGTH).toPrecision(2)
    if (length !== 1)
        mileText += "s";

    text +=
        `<hr>Length: ${length} ${mileText}
        <br>Width: ${tornado.TOR_WIDTH} yards
        <hr>Deaths: ${tornado.DEATHS}
        <br>Injuries: ${tornado.INJURIES}
        <br>Property Damage: $${tornado.DAMAGE_PROPERTY.toLocaleString()}
        <br>Crop Damage: $${tornado.DAMAGE_CROPS.toLocaleString()}`

    if (tornado.EVENT_NARRATIVE) {
        text += `<hr>${tornado.EVENT_NARRATIVE}`;        
    }        

    return text;
}

function formatRAP(range, azimuth, location) {
    let text = "";
    let mileText = "mile";

    if (location) {
        if (range) {
            if (range !== 1)
                mileText += "s";
            text += `${range} ${mileText} `;
        }
    
        if (azimuth)
            text += `${azimuth} of `;
        else
            text += `Near `;

        text += `${location}`;
        return text;
    }
    else {
        return `Unknown Relative Location`;
    }
}

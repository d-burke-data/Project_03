// let api_call = "http://127.0.0.1:5000/api/v1.0/events?start_year=2020&duration=1"
let api_call = "https://bmitri.pythonanywhere.com/api/v1.0/events?start_year=2015&duration=5"
var tornadoMap;

let colorScale = {
    "U": "white",
    "0": "cyan",
    "1": "green",
    "2": "yellow",
    "3": "orange",
    "4": "red",
    "5": "black"
};

let view = {
    center: [37.09, -95.71],
    zoom: 5,
    endPointThreshold: 8
};

let tornadoURL = api_call;
let begin_markers = [];
let end_markers = [];

d3.json(tornadoURL).then(response => {
    for (let i = 0; i < response.length; i++) {
        let tornado = response[i];
        if (tornado.BEGIN_LAT) {
            let color = colorScale[tornado.TOR_F_LEVEL];
            let begin_coordinates = [tornado.BEGIN_LAT, tornado.BEGIN_LON];                
            let begin_marker = L.shapeMarker(begin_coordinates, {
                title: `${tornado.TOR_F_SCALE} Begin Point`,
                zIndexOffset: 100,
                shape: "triangle-down",
                radius: getMarkerSize(view.zoom, true),                    
                color: "black",
                weight: 1,
                fillColor: color,
                fillOpacity: 0.8
            } ).bindPopup(createPopup(tornado, true));
            begin_markers.push(begin_marker);

            if (tornado.END_LAT) {
                let end_coordinates = [tornado.END_LAT, tornado.END_LON];
                if (begin_coordinates != end_coordinates) {
                    let end_marker = L.shapeMarker(end_coordinates, {
                        title: `${tornado.TOR_F_SCALE} End Point`,
                        zIndexOffset: -100,
                        shape: "square",
                        radius: getMarkerSize(view.zoom, false),
                        color: "black",
                        weight: 1,
                        fillColor: color,
                        fillOpacity: 0.8
                    } ).bindPopup(createPopup(tornado, false));
                    end_markers.push(end_marker);
    
                    // Calculate size & frequency based on tornado length?
                    let pathMarkerFrequency = 10;
                    let pathMarkerSize = "10%";
    
                    // Path between BEGIN and END points
                    let tornado_path = L.polyline([
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
                    end_markers.push(tornado_path);
                }
            }
        }
    }

    let beginLayerGroup = L.layerGroup(begin_markers);
    let endLayerGroup = L.layerGroup(end_markers);

    let street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });

    let topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
    });

    let baseMaps = {
        "Street": street,
        "Topographic": topo
    };

    let overlays = {
        "Begin Points": beginLayerGroup,
        "End Points": endLayerGroup
    };

    tornadoMap = L.map("map", {
        center: view.center,
        zoom: view.zoom,
        layers: [street, beginLayerGroup]
    });

    L.control.layers(baseMaps, overlays, {
        collapsed: true
    }).addTo(tornadoMap);

    tornadoMap.on("zoomend", () => {
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
        resizeMarkers() });
});

function resizeMarkers() {
    begin_markers.forEach(element => {
        element.setRadius(getMarkerSize(tornadoMap.getZoom(), true));
    });
    for (let i = 0; i < end_markers.length; i++) {
        let element = end_markers[i];
        if ((i % 2) == 0) {
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

function createPopup(tornado, is_begin) {
    let text = "";
    let mileText = "mile";

    if (is_begin) {
        let timestamp = Number(tornado.BEGIN_TIMESTAMP)
        let begin_date = new Date(Date.UTC(0,0,0,0,0,timestamp))
        text +=
        `<h2>${tornado.TOR_F_SCALE} Tornado (Begin Point)</h2>
        ${formatRAP(tornado.BEGIN_RANGE, tornado.BEGIN_AZIMUTH, tornado.BEGIN_LOCATION)}, ${tornado.STATE}
        <br>Timestamp: ${timestamp}
        <br>${begin_date}`;
    }
    else {
        text +=
        `<h2>${tornado.TOR_F_SCALE} Tornado (End Point)</h2>
        ${formatRAP(tornado.END_RANGE, tornado.END_AZIMUTH, tornado.END_LOCATION)}, ${tornado.STATE}
        <br>${new Date(Number(tornado.END_TIMESTAMP)).toUTCString()}`;
    }

    lngth = Number.parseFloat(tornado.TOR_LENGTH).toPrecision(2)
    if (lngth != 1)
        mileText += "s";

    text +=
        `<hr>Length: ${lngth} ${mileText}
        <br>Width: ${tornado.TOR_WIDTH} yards
        <hr>Deaths: ${tornado.DEATHS}
        <br>Injuries: ${tornado.INJURIES}
        <br>Property Damage: $${tornado.DAMAGE_PROPERTY}
        <br>Crop Damage: $${tornado.DAMAGE_CROPS}`

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
            if (range != 1)
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
        return `Unknown Location`;
    }
}

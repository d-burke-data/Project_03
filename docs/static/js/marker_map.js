// let api_call = "http://127.0.0.1:5000/api/v1.0/events?start_year=2020&duration=1"
let api_call = "https://bmitri.pythonanywhere.com/api/v1.0/events?start_year=2020&duration=1"

function createMap(begin_markers, end_markers) {
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
        "Begin Points": begin_markers,
        "End Points": end_markers
    };

    let markerMap = L.map("map", {
        center: [37.09, -95.71],
        zoom: 5,
        layers: [street, begin_markers, end_markers]
    });

    L.control.layers(baseMaps, overlays, {
        collapsed: false
    }).addTo(markerMap);
}

function createMarkers() {
    // let tornadoURL = "../../../Data/Tornadoes_1950_2024.json"
    let tornadoURL = api_call

    d3.json(tornadoURL).then(response => {
        // console.log(response);
        let begin_markers = [];
        let end_markers = [];

        for (let i = 0; i < response.length; i++) {
            let tornado = response[i];
            if (tornado.BEGIN_LAT) {
                let begin_coordinates = [tornado.BEGIN_LAT, tornado.BEGIN_LON];                
                let begin_marker = L.marker(begin_coordinates, {
                    title: "TORNADO"
                } ).bindPopup(createPopup(tornado, true));
                begin_markers.push(begin_marker);

                if (tornado.END_LAT) {
                    let end_coordinates = [tornado.END_LAT, tornado.END_LON];
                    let end_marker = L.marker(end_coordinates, {
                        title: "TORNADO"
                    } ).bindPopup(createPopup(tornado, false));
                    end_markers.push(end_marker);

                    let arrow = new Image();
                    arrow.src = "../Web/static/images/arrow_ci.png";
                    let options = {
                        label: "LINE PLEASE!",
                        labelColor: 'black',
                        img: arrow
                    }
                    // let angleMarker = L.angleMarker(latlng, options); // !!!
                    // let angle = angleMarker.getAngle(begin_coordinates,
                                                    //  end_coordinates);
                    // angleMarker.setHeading(angle);
                    // map.addLayer(angleMarker); // !!!
                    

                }
            }
        }

        createMap(L.layerGroup(begin_markers), L.layerGroup(end_markers));
    });
}

function createPopup(tornado, is_begin) {
    let text = "";
    let mile_text = "mile";

    if (is_begin) {
        text +=
        `<h2>${tornado.TOR_F_SCALE} Tornado (Begin Point)</h2>
        ${formatRAP(tornado.BEGIN_RANGE, tornado.BEGIN_AZIMUTH, tornado.BEGIN_LOCATION)}
        <br>${tornado.BEGIN_TIMESTAMP}`;
        if (tornado.BEGIN_RANGE != 1)
            mile_text += "s";
    }
    else {
        text +=
        `<h2>${tornado.TOR_F_SCALE} Tornado (End Point)</h2>
        ${formatRAP(tornado.END_RANGE, tornado.END_AZIMUTH, tornado.END_LOCATION)}
        <br>${tornado.END_TIMESTAMP}
        `;
        if (tornado.END_RANGE != 1)
            mile_text += "s";
    }
    text +=
        `<hr>Length: ${tornado.TOR_LENGTH} ${mile_text}
        <br>Width: ${tornado.TOR_WIDTH} yards
        <hr>Deaths: ${tornado.DEATHS}
        <br>Inuries: ${tornado.INJURIES}
        <br>Property Damage: $${tornado.DAMAGE_PROPERTY}
        <br>Crop Damage: $${tornado.DAMAGE_CROPS}`

    if (tornado.EVENT_NARRATIVE) {
        text += `<hr>${tornado.EVENT_NARRATIVE}`;        
    }        

    return text;
}


function formatRAP(range, azimuth, location) {
    let text = "";
    let mile_text = "mile";

    if (location) {
        if (range) {
            if (range != 1)
                mile_text += "s";
            text += `${range} ${mile_text} `;
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

createMarkers();

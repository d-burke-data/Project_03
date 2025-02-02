function createMap(Heat_layer) {
    // Create the tile layers for the background of the map
    let streetmap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });

    // Create a baseMaps object
    let baseMaps = {
        "Street Map": streetmap,
    };

    // Create an overlays object
    let overlays = {
        "Heatmap": Heat_layer
    };

    // Create the map object
    let map = L.map("map", {
        center: [40.73, -74.0059], // Initial map center (you can change to your focus area)
        zoom: 12,
        layers: [streetmap, Heat_layer]
    });

    // Add layer control
    L.control.layers(baseMaps, overlays, {
        collapsed: false
    }).addTo(map);
}

function createMarkers() {
    // GeoJSON county data with fips
    let URL = "Data/geojson-counties-fips.json";

    // Grab data
    d3.json(URL).then(response => {
        console.log(response);

        // Begin heat data
        let heatData = [];

        // Loop (for each) through all GeoJSON county data with fips
        





        // Create the heatmap layer using heatData
        let Heat_layer = L.heatLayer(heatData, {
            radius: 20,
            blur: 15,
            maxZoom: 10
        });

        // Create the map and add the heatmap layer
        createMap(Heat_layer);
    });
}

// Call the function to load the heatmap
createMarkers();
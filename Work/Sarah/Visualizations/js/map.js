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
        center: [40.73, -74.0059], 
        zoom: 12,
        layers: [streetmap, Heat_layer]
    });

    // Add layer control
    L.control.layers(baseMaps, overlays, {
        collapsed: false
    }).addTo(map);
}

function createMarkers() {

    //API and data call
    let geoJSON_URL = "Data/geojson-counties-fips.json";
    let api_URL = "https://bmitri.pythonanywhere.com/api/v1.0/dashboard?start_year=2021&duration=1&state=CA";   //  sample with Base API URL parameters needed to know details(need to add endpoints for all counties) 
    
    //county json data
    d3.json(geoJSON_URL).then(geoData => {    //why the geoData and not response 
        console.log(geoData);
    //api data 
    d3.json(api_URL).then(eventData => {
        console.log(response);

    // Loop through each county 
    geoData.features.forEach(county => {
        let county_id = county.id; //fips = id in data 
        let count_name = county.properties.NAME; // Name of county

 












// Create a layer group for heatmap
let Heat_layer = L.heatLayer(heatArray, {
radius: 25,
blur: 15,
maxZoom: 10
});

//create map and have heatmap 
createMap(Heat_layer);
});
}











// county json layout 
// {
//     "type": "FeatureCollection",
//     "features": [
//       {
//         "type": "Feature",
//         "properties": {
//           "GEO_ID": "0500000US01001",
//           "STATE": "01",
//           "COUNTY": "001",
//           "NAME": "Autauga"
//         },
//         "geometry": {
//           "type": "Polygon",
//           "coordinates": [[...]]
//         },
//         "id": "01001"
//       },
//       {
//         "type": "Feature",
//         "properties": {
//           "GEO_ID": "0500000US01009",
//           "STATE": "01",
//           "COUNTY": "009",
//           "NAME": "Blount"
//         },
//         "geometry": {
//           "type": "Polygon",
//           "coordinates": [[...]]
//         },
//         "id": "01009"
//       }
//     ]
//   }

     
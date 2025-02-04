// Initialize base map layer
let baseMaps = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

// Create the map object
let map = L.map("map", {
    center: [40.73, -74.0059],
    zoom: 12,
});

// Add base map to the map object
baseMaps.addTo(map);

// Define API URL
let api_url = "https://bmitri.pythonanywhere.com/api/v1.0/events?start_year=2024&duration=1&state=TX";

// Load API data using D3
d3.json(api_url).then(function(Data) {  // Use "Data" here, as that is what you named the variable
    console.log(Data);


    //  END_LAT and END_LON from api
    let heatData = Data.map(entry => [
        parseFloat(entry.END_LAT),
        parseFloat(entry.END_LON),
       
    ]);

    // Create and add the heatmap layer
    L.heatLayer(heatData, {
        radius: 20, 
        blur: 5,
        minOpacity: 0.5,      
        maxZoom: 17,  
        // gradient: {
        //     0.2: 'blue',     //least affected area
        //     0.4: 'yellow',
        //     0.6: 'orange',
        //     1.0: 'red'        //hot stop area
        // }


    }).addTo(map);


});

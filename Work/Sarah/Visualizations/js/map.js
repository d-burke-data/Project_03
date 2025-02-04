let baseMaps = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
 });
 
 
 // Create the map object
 let map = L.map("map", {
    center: [40.73, -74.0059],
    zoom: 12,
 
 
 });
 baseMaps.addTo(map);
 
 
 
 
 // Load the GeoJSON data
 let geoJSON_URL = "Data/geojson-counties-fips.json";
 // Load API data
 let api_URL = "https://bmitri.pythonanywhere.com/api/v1.0/dashboard?start_year=2021&duration=1&state=CA";
 
 
 
 
 
 
 // Get the data with d3.
 d3.json(geoJSON_URL).then(function(geoData) {
    // console.log(geoData["features"][0]["id"]);
 
 
    // Fetch data from the API
    d3.json(api_URL).then(function(apiData) {
        // console.log(apiData)
        
        // Array for api
        const api_array = apiData["county_heatmap"];
        // console.log(api_array);
       
//         // Example of filter
//         // const array_update = api_array.filter((result) => result["fip"]=="06037");
//         // console.log(array_update);

//         //array for geojson not being used 
//         // const Geojson_array = geoData["features"] 

        
//         // Filter attempt 1: to flip from geoJson to api (bigger to smaller data)
//         // const filtered_data = geoJSON_data.filter(item => 
//         //     api_array.some(apiItem => apiItem.fip === item.id)
//         // );



//         // Fil
//         // const filtered_api = api_response.filter(apiItem =>
//         //     geoJSON_data.some(geoItem => geoItem.id === apiItem.fip)
//         // );


//         // // .find AL generated with Mitchell
//         // const matchedFeatures = geoData.features.map(feature => {
//         //     const matchingCounty = api_array.find(county => county.fip === feature.id);
            
//         //     if (matchingCounty) {
//         //         feature.properties.count = matchingCounty.count;
//         //     }
            
//         //     return feature;
//         // });
        
//         // console.log(matchedFeatures);


        // .map with Mitchell and most progress 
        const matchedFeatures = geoData.features.map(feature => {
            // Find the matching county data from the heatmap
            const matchingCounty = api_array.find(county => 
                county.fip === feature.id
            );
            
            // If there's a match, return the feature with the count added
            if (matchingCounty) {
                return {
                    ...feature,
                    properties: {
                        ...feature.properties,
                        count: matchingCounty.count
                    }
                };
            }
            return feature; // Return original feature if no match found
        });
        
        console.log(matchedFeatures);
//         // Worksish but does not add a new count layerto the array "properties" 


// // ChatGBt adds count but zero for all(we need count from api)
// d3.json(geoJSON_URL).then(function(geoData) {
//     d3.json(api_URL).then(function(apiData) {
//         const api_array = apiData["county_heatmap"];

//         console.log("GeoData Sample:", geoData.features[0]);
//         console.log("API Data Sample:", api_array[0]);

//         const matchedFeatures = geoData.features.map(feature => {
//             feature.properties = feature.properties || {}; // Ensure properties exist

//             const matchingCounty = api_array.find(county => 
//                 String(county.fip) === String(feature.id)
//             );

//             if (matchingCounty) {
//                 feature.properties.count = matchingCounty.count;
//             } else {
//                 feature.properties.count = 0;
//             }

//             return feature;
//         });

//         console.log("Updated Features:", matchedFeatures);
    










    //demo in plugnin with hash 

        // apiData[county_heatmap]
        // console.log(apiData["county_heatmap"][0]["fip"]);

        // //Get the data with d3.
        //  d3.json(geoJSON_URL).then(function(geoData) {
        //     // Fetch data from the API
        //     d3.json(api_URL).then(function(apiData) {


        //  //Create a hash table for easy reference (fips as label & count as value) (a dictionary of fip and count from api)
        //   var dataHash = data.reduce(function (hash, item) {
        //     if (item.fips) {
        //       hash[item.fips] = isNaN(item.count) ? null : +item.count;
        //     }
        //     return hash;
        //   }, {});


        //   //Add value from hash table to geojson properties: API & geoJSON data based on matching fips and ID (join id and fips from data hash fip )
        //   geojson.features.forEach(function (item) {
        //     item.properties.count = dataHash[item.properties.ID] || null;
        //   });

 
 
      // Create a new choropleth layer.
      let geojson = L.choropleth(geoData, {
 
 
          // Define which property in the features to use.
          valueProperty: "Count", // intensity level 
 
 
          // Set the color scale.
          scale: ["#ffffb2", "#b10026"],
 
 
          // The number of breaks in the step range
          steps: 10,
 
 
          // q for quartile, e for equidistant, k for k-means
          mode: "q",
          style: {
              // Border color
              color: "#008000",      
              weight: 1,
              fillOpacity: 0.8
          },
 
 
      }).addTo(map);
  });
 });
 


// geoJson 
// {
//     "type": "FeatureCollection",
//     "features": [
//       {
//         "type": "Feature",
//         "properties": {
//           "ID": "06001",
//           "NAME": "Alameda County"
//         },
//         "geometry": {
//           "type": "Polygon",
//           "coordinates": [ ... ]
//         }
//       }
//     ]
//   }
  









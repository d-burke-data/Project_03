function buildPieChart() {
    // Fetch data from the Flask API
    d3.json('https://bmitri.pythonanywhere.com/api/v1.0/dashboard?start_year=2020&duration=1')
      .then(data => {
        console.log(data);
  
        // Extract the "scale_pie" 
        let scaleData = data.scale_pie || [];
  
        // Extract labels (scales) and values (counts)
        let labels = scaleData.map(entry => entry.scale);
        let values = scaleData.map(entry => entry.count);
        
        // Set colors
        let colorMap = {
          "EF0/F0": "#00FFFF", // CYAN
          "EF1/F1": "#00FF00", // GREEN
          "EF2/F2": "#FFFF00", // YELLOW
          "EF3/F3": "#FFA500", // ORANGE
          "EF4/F4": "#FF0000", // RED
          "EFU/FU": "#D3D3D3"  // GRAY
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
            marker: {colors: colors}
        }];
  
        // Define Layout
        let layout = {
            title: 'Tornado Scale Distribution',
            height: 400,
            width: 400
        };
  
        // Render Pie Chart inside the correct div
        Plotly.newPlot('pie-chart', pieData, layout);
    })
  }
  
buildPieChart();
  
// function buildPieChart() {
//   // Fetch data from the Flask API
//   d3.json('https://bmitri.pythonanywhere.com/api/v1.0/dashboard?start_year=2020&duration=1')
//     .then(data => {
//       console.log(data);

//       // Extract "scale_pie" safely
//       let scaleData = data.scale_pie || [];

//       if (!Array.isArray(scaleData) || scaleData.length === 0) {
//           console.error("No valid data received for scale_pie.");
//           return;
//       }

//       // Extract labels (scales) and values (counts)
//       let labels = scaleData.map(entry => entry.scale);
//       let values = scaleData.map(entry => entry.count);
      
//       // Define color mapping for each tornado scale
//       let colorMap = {
//           "EF0/F0": "#00FFFF", // CYAN
//           "EF1/F1": "#00FF00", // GREEN
//           "EF2/F2": "#FFFF00", // YELLOW
//           "EF3/F3": "#FFA500", // ORANGE
//           "EF4/F4": "#FF0000", // RED
//           "EFU/FU": "#FFFFFF"  // WHITE
//       };

//       // Assign colors based on labels
//       let colors = labels.map(label => colorMap[label] || "#808080"); // Default to gray if not found

//       // Create Pie Chart Data
//       let pieData = [{
//           labels: labels,
//           values: values,
//           type: 'pie',
//           textinfo: 'label+percent',
//           insidetextorientation: 'radial',
//           marker: { colors: colors }
//       }];

//       // Define Layout
//       let layout = {
//           title: 'Tornado Scale Distribution',
//           height: 400,
//           width: 400
//       };

//       // Render Pie Chart inside the correct div
//       Plotly.newPlot('pie-chart', pieData, layout);
//   })
//   .catch(error => console.error("Error fetching data:", error));
// }

// // Call the function to build the pie chart
// buildPieChart();

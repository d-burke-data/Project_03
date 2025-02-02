function buildPieChart() {
  // Fetch data from the Flask API
  d3.json('http://127.0.0.1:5000/api/v1.0/scales').then(data => {
      
      // Count occurrences of each F_SCALE value
      let scaleCounts = {};
      data.forEach(entry => {
          let scale = entry.TOR_F_SCALE;
          scaleCounts[scale] = (scaleCounts[scale] || 0) + 1;
      });

      // Extract labels and values for Plotly
      let labels = Object.keys(scaleCounts);
      let values = Object.values(scaleCounts);

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
          title: 'Tornado Fujita Scale Distribution',
          height: 400,
          width: 400
      };

      // Render Pie Chart inside the correct div
      Plotly.newPlot('pie-chart', pieData, layout);
  });
}

// Ensure the script runs after the page loads
document.addEventListener("DOMContentLoaded", buildPieChart);

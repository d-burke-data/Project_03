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
            title: 'Tornado Scale Distribution',
            height: 400,
            width: 400
        };
  
        // Render Pie Chart inside the correct div
        Plotly.newPlot('pie-chart', pieData, layout);
    })
  }
  
buildPieChart();
  
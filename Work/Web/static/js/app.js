// define url
const apiURL = 'https://bmitri.pythonanywhere.com/api/v1.0/dashboard?start_year=2020&duration=1&state=AL'

//fetch the api
// fetch(apiURL)
//     .then(response => response.json())
//     .then(data => {
//         // console log it
//         console.log('API data:', data);
//     })
//     .catch(error => {
//         console.error('Error fectching API:', error);
//     });

d3.json(apiURL).then(data => {
    console.log('API data:', data);
});
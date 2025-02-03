// define url
const baseURL = 'https://bmitri.pythonanywhere.com/api/v1.0/';
const optionsURL = baseURL + 'options';
//const optionsURL = `${baseURL}options`;
const countiesURL = baseURL + 'counties';
//const apiURL = 'https://bmitri.pythonanywhere.com/api/v1.0/dashboard?start_year=2020&duration=1&state=AL';
const dashboardURL = baseURL + 'dashboard';

/*****************************************
 * DOM References
 *****************************************/
const dashboardForm = document.getElementById('dashboardForm');
const startYearDropdown = document.getElementById('startYearDropdown');
const durationDropdown = document.getElementById('durationDropdown');

/*****************************************
 * Populate drowpdown options function
 *****************************************/
function populateDropdown(selectElement, items, placeholder) {
    // clear existing options
    selectElement.innerHTML = '';

    // add placeholder option
    const placeholderOption = document.createElement('option');
    placeholderOption.value = '';
    placeholderOption.textContent = placeholder;
    selectElement.appendChild(placeholderOption);

    // add dropdown options
    items.forEach((item) => {
        const option = document.createElement('option');
        option.value = item;
        option.textContent = item;
        selectElement.appendChild(option);
    });
}

/*****************************************
 * Fetch options from API (on page load)
 *****************************************/
window.addEventListener('DOMContentLoaded', () => {
    // fetch options route for years and states
    fetch(optionsURL)
    .then((res) => res.json())
    .then((data) => {
        // populate start year and state dropdowns
        populateDropdown(startYearDropdown, data.years, 'Select...');
        //populateDropdown(startYearDropdown, data.states, 'Select State');
    })
    .catch((err) => console.error('Error fetching options', err));

    // hardcode duration dropdown options (1-10 years)
    const durations = [1,2,3,4,5,6,7,8,9,10];
    populateDropdown(durationDropdown, durations, 'Select...');
});

/*****************************************
 * Generate button
 *****************************************/
dashboardForm.addEventListener('submit', function (event) {
    
    // prevent page reload
    event.preventDefault();

    // collect values
    const startYear = startYearDropdown.value;
    const duration = durationDropdown.value;

    // validate required fields
    if (!startYear || !duration) {
        alert('Please select a start year or duration');
        return;
    }

    // build final dashboard url api call
    let params = new URLSearchParams({
        start_year: startYear,
        duration: duration
    });

    const finalURL = `${dashboardURL}?${params.toString()}`

    // fetch data
    d3.json(finalURL).then(data => {
        console.log('API data:', data);
    });
});

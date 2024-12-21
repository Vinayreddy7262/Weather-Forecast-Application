
const apiKey = "94cfe240c26fd25083d4781bb3799f23";
const cityInput = document.getElementById("city-input");
const searchBtn = document.getElementById("search-btn");
const locationBtn = document.getElementById("location-btn");
const recentCitiesDropdown = document.getElementById("recent-cities");
const recentCitiesContainer = document.getElementById("recent-cities-container");
const currentWeatherSection = document.getElementById("current-weather");
const forecastSection = document.getElementById("forecast");
const errorMessageDiv = document.getElementById("error-message");


// Initialize recent cities
let recentCities = JSON.parse(sessionStorage.getItem("recentCities")) || [];
updateRecentCitiesDropdown();

// Event Listeners
searchBtn.addEventListener("click", searchWeather);
locationBtn.addEventListener("click", getLocationAndWeather);
recentCitiesDropdown.addEventListener("change", selectRecentCity);

// Function to fetch current weather data
async function getCurrentWeather(city) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error("City not found");
        }
        const data = await response.json();
        updateCurrentWeatherUI(data);
        addCityToRecent(city);
    } catch (error) {
        displayError(error.message);
    }
}

// Function to fetch 5-day forecast data
async function getForecast(city) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error("Forecast data not available");
        }
        const data = await response.json();
        updateForecastUI(data);
    } catch (error) {
        displayError(error.message);
    }
}

// Function to get user's location and fetch weather
function getLocationAndWeather() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`;
                try {
                    const response = await fetch(apiUrl);
                    if (!response.ok) {
                        throw new Error("Weather data not available for your location");
                    }
                    const data = await response.json();
                    updateCurrentWeatherUI(data);
                    addCityToRecent(data.name);
                    // Also fetch and update the 5-day forecast
                    getForecast(data.name);
                } catch (error) {
                    displayError(error.message);
                }
            },
            (error) => {
                displayError("Unable to retrieve your location");
                console.error(error);
            }
        );
    } else {
        displayError("Geolocation is not supported by your browser");
    }
}

// Function to handle city search
function searchWeather() {
    const city = cityInput.value.trim();
    if (city) {
        clearError();
        getCurrentWeather(city);
        getForecast(city);
        cityInput.value = "";
    } else {
        displayError("Please enter a city name");
    }
}

// Function to handle selection from recent cities dropdown
function selectRecentCity() {
    const selectedCity = recentCitiesDropdown.value;
    if (selectedCity) {
        clearError();
        getCurrentWeather(selectedCity);
        getForecast(selectedCity);
    }
}

// Function to add a city to recent searches
function addCityToRecent(city) {
    if (!recentCities.includes(city)) {
        recentCities.unshift(city); 
        recentCities = recentCities.slice(0, 10); 
        sessionStorage.setItem("recentCities", JSON.stringify(recentCities));
        updateRecentCitiesDropdown();
    }
}

// Function to update the recent cities dropdown
function updateRecentCitiesDropdown() {
    if (recentCities.length > 0) {
        recentCitiesDropdown.innerHTML = recentCities
            .map((city) => `<option value="${city}">${city}</option>`)
            .join("");
        recentCitiesContainer.classList.remove("hidden"); 
        recentCitiesDropdown.classList.remove("hidden");
    } else {
        recentCitiesContainer.classList.add("hidden"); 
        recentCitiesDropdown.classList.add("hidden");
    }
}

// Function to update the UI
function updateCurrentWeatherUI(data) {
    currentWeatherSection.innerHTML = `
        <div class="weather-card p-6">
            <h2 class="text-3xl font-bold mb-4">${data.name}, ${data.sys.country}</h2>
            <div class="flex items-center mb-4">
                <img src="http://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" alt="${data.weather[0].description}" class="weather-icon">
                <p class="text-5xl font-semibold ml-4">${data.main.temp.toFixed(1)}°C</p>
            </div>
            <p class="mb-2 text-gray-700">Feels like: ${data.main.feels_like.toFixed(1)}°C</p>
            <p class="mb-2 text-gray-700">Humidity: ${data.main.humidity}%</p>
            <p class="mb-2 text-gray-700">Wind Speed: ${data.wind.speed} m/s</p>
            <p class="text-gray-700">Condition: ${data.weather[0].description}</p>
        </div>
    `;
}

// Function to update the UI with 5-day forecast data
function updateForecastUI(data) {
    const dailyForecast = {};
    data.list.forEach((forecast) => {
        const date = new Date(forecast.dt_txt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        if (!dailyForecast[date]) {
            dailyForecast[date] = {
                temp: forecast.main.temp,
                icon: forecast.weather[0].icon,
                description: forecast.weather[0].description,
                humidity: forecast.main.humidity,
                wind: forecast.wind.speed,
            };
        }
    });

    forecastSection.innerHTML = Object.entries(dailyForecast)
        .map(
            ([date, forecast]) => `
        <div class="weather-card p-4 flex flex-col items-center justify-center">
            <h3 class="font-bold mb-2 text-lg">${date}</h3>
            <img src="http://openweathermap.org/img/wn/${forecast.icon}@2x.png" alt="${forecast.description}" class="weather-icon">
            <p class="mt-2 text-xl font-semibold">${forecast.temp.toFixed(1)}°C</p>
            <p class="text-gray-700">Humidity: ${forecast.humidity}%</p>
            <p class="text-gray-700">Wind: ${forecast.wind} m/s</p>
        </div>
    `
        )
        .join("");
}

// Function to display error message
function displayError(message) {
    errorMessageDiv.textContent = message;
    errorMessageDiv.classList.remove("hidden");
}

// Function to clear error message
function clearError() {
    errorMessageDiv.textContent = "";
    errorMessageDiv.classList.add("hidden");
}
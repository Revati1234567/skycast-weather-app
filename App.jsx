import { useState } from "react";
import "./App.css";

function getWeatherIcon(code) {
  if (code === 0) return "☀️";
  if ([1, 2].includes(code)) return "🌤️";
  if (code === 3) return "☁️";
  if ([45, 48].includes(code)) return "🌫️";
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code))
    return "🌧️";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "❄️";
  if ([95, 96, 99].includes(code)) return "⛈️";
  return "🌡️";
}

function getDescription(code) {
  if (code === 0) return "Clear Sky";
  if ([1, 2].includes(code)) return "Partly Cloudy";
  if (code === 3) return "Overcast";
  if ([45, 48].includes(code)) return "Foggy";
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code))
    return "Rainy";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Snowy";
  if ([95, 96, 99].includes(code)) return "Thunderstorm";
  return "Variable Conditions";
}

function getToday() {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
}

function formatDate(date) {
  if (!date) return "";
  return new Date(date + "T12:00:00").toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function WeatherCard({ day, selected, onClick }) {
  return (
    <button
      type="button"
      className={`forecast-card ${selected ? "selected" : ""}`}
      onClick={onClick}
      aria-pressed={selected}
    >
      <span className="forecast-day">{formatDate(day.time).split(",")[0]}</span>
      <span className="forecast-date">
        {new Date(day.time + "T12:00:00").toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
        })}
      </span>
      <span className="forecast-icon">{getWeatherIcon(day.code)}</span>
      <span className="forecast-description">{getDescription(day.code)}</span>
      <span className="forecast-temperatures">
        {Math.round(day.max)}° <span>{Math.round(day.min)}°</span>
      </span>
      <span className="forecast-rain">💧 {day.rain}%</span>
    </button>
  );
}

export default function App() {
  const [city, setCity] = useState("");
  const [location, setLocation] = useState("");
  const [selectedDate, setSelectedDate] = useState(getToday);
  const [current, setCurrent] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedDay = forecast.find((day) => day.time === selectedDate);

  async function searchWeather(event) {
    event.preventDefault();

    if (!city.trim()) {
      setError("Please enter a city name.");
      return;
    }

    setLoading(true);
    setError("");
    setCurrent(null);
    setForecast([]);
    setLocation("");

    try {
      const geoResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          city.trim()
        )}&count=10&language=en&format=json`
      );

      if (!geoResponse.ok) throw new Error("Unable to find the city.");

      const geoData = await geoResponse.json();

      if (!geoData.results?.length) {
        throw new Error("City not found. Please check the spelling.");
      }

      const place =
        geoData.results.find(
          (item) => item.name.toLowerCase() === city.trim().toLowerCase()
        ) || geoData.results[0];

      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=7&timezone=auto`
      );

      if (!weatherResponse.ok) {
        throw new Error("Unable to fetch weather data.");
      }

      const data = await weatherResponse.json();

      setLocation(
        `${place.name}${place.admin1 ? ", " + place.admin1 : ""}, ${place.country}`
      );
      setCurrent(data.current);

      const daily = data.daily;
      const days = daily.time.map((time, index) => ({
        time,
        code: daily.weather_code[index],
        max: daily.temperature_2m_max[index],
        min: daily.temperature_2m_min[index],
        rain: daily.precipitation_probability_max[index] ?? 0,
      }));

      setForecast(days);

      // If the chosen date is unavailable, select the first forecast day.
      if (!days.some((day) => day.time === selectedDate)) {
        setSelectedDate(days[0].time);
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function chooseDate(date) {
    setSelectedDate(date);
  }

  return (
    <main className="app">
      <div className="dashboard">
        <header className="topbar">
          <div className="brand">
            <div className="brand-icon">⛅</div>
            <div>
              <h1>SkyCast</h1>
              <p>WEATHER DASHBOARD</p>
            </div>
          </div>
          <div className="live-label">
            <span className="live-dot" />
            LIVE WEATHER
          </div>
        </header>

        <section className="welcome-section">
          <div>
            <p className="eyebrow">YOUR PERSONAL WEATHER STATION</p>
            <h2>Weather, at a glance.</h2>
            <p className="welcome-text">
              Explore current conditions and your weekly forecast.
            </p>
          </div>
          <div className="welcome-illustration">🌦️</div>
        </section>

        <section className="search-panel">
          <form className="search-form" onSubmit={searchWeather}>
            <span className="search-icon">⌕</span>
            <input
              type="text"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              placeholder="Search a city, e.g. Hyderabad"
              aria-label="Search city"
            />
            <button type="submit" disabled={loading}>
              {loading ? "Searching..." : "Search Weather"}
            </button>
          </form>

          <div className="date-picker-row">
            <div className="date-label">
              <span>📅</span>
              <div>
                <strong>Explore a date</strong>
                <p>Select a day for its forecast</p>
              </div>
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => chooseDate(event.target.value)}
              aria-label="Select forecast date"
            />
            <button
              className="today-button"
              type="button"
              onClick={() => {
                const today = getToday();
                setSelectedDate(today);
              }}
            >
              Today
            </button>
          </div>
        </section>

        {error && <div className="error-message">⚠️ {error}</div>}

        {!current && !loading && !error && (
          <section className="empty-state">
            <div className="empty-icon">🌍</div>
            <h2>Your weather journey starts here</h2>
            <p>Search for your city to discover its weather and forecast.</p>
            <button
              type="button"
              className="example-button"
              onClick={() => setCity("Hyderabad")}
            >
              Try Hyderabad ↗
            </button>
          </section>
        )}

        {loading && (
          <div className="loading-state">
            <span className="loading-icon">🌤️</span>
            <p>Getting the latest weather...</p>
          </div>
        )}

        {current && !loading && (
          <>
            <section className="current-panel">
              <div className="current-heading">
                <div>
                  <p className="eyebrow">CURRENT CONDITIONS</p>
                  <h2>{location}</h2>
                  <p className="current-date">{formatDate(current.time?.slice(0, 10) || selectedDate)}</p>
                </div>
                <span className="location-badge">📍 Local forecast</span>
              </div>

              <div className="hero-weather">
                <div className="hero-temperature">
                  <span className="hero-icon">
                    {getWeatherIcon(current.weather_code)}
                  </span>
                  <div>
                    <div className="temperature">
                      {Math.round(current.temperature_2m)}
                      <span>°C</span>
                    </div>
                    <p className="condition">
                      {getDescription(current.weather_code)}
                    </p>
                    <p className="feels-like">
                      Feels like {Math.round(current.apparent_temperature)}°C
                    </p>
                  </div>
                </div>

                <div className="hero-side">
                  <span className="hero-side-label">WEATHER SUMMARY</span>
                  <p>
                    {getDescription(current.weather_code)} conditions in{" "}
                    {location.split(",")[0]}.
                  </p>
                  <div className="hero-side-line" />
                  <span className="hero-side-label">WIND CONDITIONS</span>
                  <p>Wind speed is {current.wind_speed_10m} km/h.</p>
                </div>
              </div>

              <div className="stats-grid">
                <div className="stat-card humidity-card">
                  <span className="stat-icon">💧</span>
                  <p>Humidity</p>
                  <strong>{current.relative_humidity_2m}%</strong>
                  <span className="stat-note">Relative humidity</span>
                </div>
                <div className="stat-card wind-card">
                  <span className="stat-icon">💨</span>
                  <p>Wind speed</p>
                  <strong>{current.wind_speed_10m} <small>km/h</small></strong>
                  <span className="stat-note">Current wind</span>
                </div>
                <div className="stat-card rain-card">
                  <span className="stat-icon">🌧️</span>
                  <p>Precipitation</p>
                  <strong>{current.precipitation} <small>mm</small></strong>
                  <span className="stat-note">Current amount</span>
                </div>
                <div className="stat-card date-card">
                  <span className="stat-icon">🗓️</span>
                  <p>Selected date</p>
                  <strong className="selected-date-value">
                    {new Date(selectedDate + "T12:00:00").toLocaleDateString(
                      "en-IN",
                      { day: "numeric", month: "short" }
                    )}
                  </strong>
                  <span className="stat-note">Forecast selection</span>
                </div>
              </div>
            </section>

            <section className="selected-forecast">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">YOUR DATE, YOUR FORECAST</p>
                  <h2>Selected-day forecast</h2>
                </div>
                <span className="date-chip">{formatDate(selectedDate)}</span>
              </div>

              {selectedDay ? (
                <div className="selected-day-card">
                  <div className="selected-day-icon">
                    {getWeatherIcon(selectedDay.code)}
                  </div>
                  <div className="selected-day-description">
                    <h3>{getDescription(selectedDay.code)}</h3>
                    <p>Expected conditions for {formatDate(selectedDate)}</p>
                  </div>
                  <div className="selected-day-temperatures">
                    <strong>{Math.round(selectedDay.max)}°</strong>
                    <span>{Math.round(selectedDay.min)}° low</span>
                  </div>
                  <div className="selected-day-rain">
                    <span>💧</span>
                    <strong>{selectedDay.rain}%</strong>
                    <small>Rain chance</small>
                  </div>
                </div>
              ) : (
                <div className="no-forecast">
                  <span>🗓️</span>
                  <p>
                    This date is outside the available 7-day forecast. Choose
                    a date shown in the forecast below.
                  </p>
                </div>
              )}
            </section>

            <section className="weekly-section">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">PLAN AHEAD</p>
                  <h2>7-day forecast</h2>
                </div>
                <span className="week-chip">7 DAYS</span>
              </div>
              <p className="section-subtitle">
                Select any forecast card to view its details above.
              </p>
              <div className="forecast-grid">
                {forecast.map((day) => (
                  <WeatherCard
                    key={day.time}
                    day={day}
                    selected={day.time === selectedDate}
                    onClick={() => chooseDate(day.time)}
                  />
                ))}
              </div>
            </section>
          </>
        )}

        <footer className="footer">
          <span>⛅</span>
          <p>SkyCast Weather</p>
          <span className="footer-divider">•</span>
          <p>Weather data by Open-Meteo</p>
        </footer>
      </div>
    </main>
  );
}
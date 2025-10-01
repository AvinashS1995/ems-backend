import axios from "axios";
import { WeatherForcastLog, Cities } from "../Models/weatherModel.js";
import { getAQILabel, getPollutantAQI } from "../common/weather.js";

export const getWeather = async (req, res) => {
  try {
    const { city } = req.body;
    if (!city) return res.status(400).json({ error: "City is required" });

    const location = await Cities.findOne({
      city: { $regex: `^${city}$`, $options: "i" },
    });

    const cachedData = await WeatherForcastLog.findOne({
      latitude: location.latitude,
      longitude: location.longitude,
    });

    if (cachedData) {
      console.log("✅ Using cached weather data");
      return res.status(201).json({
        status: "success",
        message: "Records(s) Fetched Successfully!",
        data: {
          city: cachedData.city,
          district: cachedData.district,
          state: cachedData.state,
          country: cachedData.country,
          country_code: cachedData.country_code,
          latitude: cachedData.latitude,
          longitude: cachedData.longitude,
          forecast: cachedData.forecast,
        },
      });
    }

    const forecastRes = await axios.get(
      `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&forecast_days=10&timezone=auto&daily=sunrise,sunset,uv_index_max,temperature_2m_min,temperature_2m_max,apparent_temperature_min,apparent_temperature_max,sunshine_duration,daylight_duration,weather_code,windspeed_10m_max,relative_humidity_2m_max&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation_probability,precipitation,apparent_temperature,visibility,weather_code&current=temperature_2m,relative_humidity_2m,wind_speed_10m,is_day,apparent_temperature,precipitation,weather_code,surface_pressure&minutely_15=visibility,temperature_2m,apparent_temperature,weather_code`
    );

    const airQualityRes = await axios.get(
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${location.latitude}&longitude=${location.longitude}&hourly=pm10,pm2_5,carbon_monoxide,ozone&timezone=auto`
    );

    const airQualityData = {
      pm2_5: airQualityRes.data.hourly.pm2_5[0],
      pm10: airQualityRes.data.hourly.pm10[0],
      ozone: airQualityRes.data.hourly.ozone[0],
      carbon_monoxide: airQualityRes.data.hourly.carbon_monoxide[0],
      label: getAQILabel(
        Math.max(
          getPollutantAQI(airQualityRes.data.hourly.pm2_5[0], "pm2_5"),
          getPollutantAQI(airQualityRes.data.hourly.pm10[0], "pm10")
        )
      ),
    };

    forecastRes.data.airQuality = airQualityData;

    const updatedWeather = await WeatherForcastLog.findOneAndUpdate(
      { latitude: location.latitude, longitude: location.longitude },
      {
        city: location.name,
        district: location.admin2,
        state: location.admin1,
        country: location.country,
        country_code: location.country_code,
        latitude: location.latitude,
        longitude: location.longitude,
        forecast: forecastRes.data,
        updatedAt: new Date(),
      },
      { new: true, upsert: true }
    );

    console.log("🌍 API called & cached");
    res.status(201).json({
      status: "success",
      message: "Records(s) Fetched Successfully!",
      data: {
        city: updatedWeather.city,
        district: updatedWeather.district,
        state: updatedWeather.state,
        country: updatedWeather.country,
        country_code: updatedWeather.country_code,
        latitude: updatedWeather.latitude,
        longitude: updatedWeather.longitude,
        forecast: updatedWeather.forecast,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      status: "fail",
      message: err.message,
    });
  }
};

export const searchCity = async (req, res) => {
  try {
    const { city } = req.body;
    if (!city)
      return res.status(400).json({
        status: "fail",
        error: "Search term is required",
      });

    const cachedCities = await Cities.find({
      city: { $regex: city, $options: "i" },
    }).limit(10);

    if (cachedCities.length > 0) {
      console.log("✅ Returning from DB cache");
      return res.status(201).json({
        status: "success",
        message: "Record(s) Fetched Successfully!",
        data: {
          cities: cachedCities,
        },
      });
    }

    const geoRes = await axios.get(
      `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=5&language=en&format=json`
    );

    if (!geoRes.data.results) {
      return res.json({ results: [] });
    }

    const savedCities = await Promise.all(
      geoRes.data.results.map(async (city) => {
        return Cities.findOneAndUpdate(
          { latitude: city.latitude, longitude: city.longitude },
          {
            city: city.name,
            district: city.admin2,
            state: city.admin1,
            country: city.country,
            country_code: city.country_code,
            latitude: city.latitude,
            longitude: city.longitude,
          },
          { upsert: true, new: true }
        );
      })
    );

    console.log("🌍 API called & cities cached");

    return res.status(201).json({
      status: "success",
      message: "Record(s) Fetched Successfully!",
      data: {
        cities: savedCities,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "fail",
      message: err.message,
    });
  }
};

export const getCurrentLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    if (!latitude || !longitude) {
      return res
        .status(400)
        .json({ error: "Latitude and longitude are required" });
    }

    const cachedCity = await Cities.findOne({ latitude, longitude });
    if (cachedCity) {
      console.log("✅ Returning cached current location");
      return res.status(200).json({
        status: "success",
        message: "Location fetched successfully",
        data: cachedCity,
      });
    }

    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`;

    const geoRes = await axios.get(nominatimUrl, {
      headers: {
        "User-Agent": "abhiyavm@gmail.com",
      },
    });

    if (!geoRes.data || !geoRes.data.address) {
      return res
        .status(404)
        .json({ error: "City not found for this location" });
    }

    const location = geoRes.data.address;

    const savedCity = await Cities.findOneAndUpdate(
      { latitude, longitude },
      {
        city: location.city || location.town || location.village || "",
        district: location.county || "",
        state: location.state || "",
        country: location.country || "",
        country_code: location.country_code || "",
        latitude,
        longitude,
      },
      { new: true, upsert: true }
    );

    console.log("🌍 Nominatim API called & cached");
    return res.status(200).json({
      status: "success",
      message: "Location fetched successfully",
      data: savedCity,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "fail",
      message: err.message,
    });
  }
};

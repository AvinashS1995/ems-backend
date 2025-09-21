import mongoose from "mongoose";

const weatherCacheSchema = new mongoose.Schema({
  city: String,
  district: String,
  state: String,
  country: String,
  country_code: String,
  latitude: Number,
  longitude: Number,
  forecast: Object,
  updatedAt: { type: Date, default: Date.now, expires: 3600 },
});

weatherCacheSchema.index({ latitude: 1, longitude: 1 }, { unique: true });

const WeatherForcastLog = mongoose.model(
  "WeatherForcastLog",
  weatherCacheSchema
);

const searchCitySchema = new mongoose.Schema({
  city: String,
  district: String,
  state: String,
  country: String,
  country_code: String,
  latitude: Number,
  longitude: Number,
  searchedAt: { type: Date, default: Date.now },
});

searchCitySchema.index({ searchedAt: 1 }, { expireAfterSeconds: 86400 });

const Cities = mongoose.model("Cities", searchCitySchema);

export { WeatherForcastLog, Cities };

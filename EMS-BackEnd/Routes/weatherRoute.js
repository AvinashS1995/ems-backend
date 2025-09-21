import express from "express";
import {
  getCurrentLocation,
  getWeather,
  searchCity,
} from "../Controllers/WeatherForcastController.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Weather
 *   description: Weather forecast APIs
 */

/**
 * @swagger
 * /api/weather/get-weather:
 *   post:
 *     summary: Get weather forecast by city
 *     tags: [Weather]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - city
 *             properties:
 *               city:
 *                 type: string
 *                 example: Delhi
 *     responses:
 *       200:
 *         description: Weather forecast data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 city:
 *                   type: string
 *                   example: Delhi
 *                 country:
 *                   type: string
 *                   example: India
 *                 country_code:
 *                   type: string
 *                   example: IN
 *                 latitude:
 *                   type: number
 *                   example: 28.61
 *                 longitude:
 *                   type: number
 *                   example: 77.21
 *                 forecast:
 *                   type: object
 *                   description: Full forecast response from Open Meteo
 *       400:
 *         description: Missing city
 *       404:
 *         description: City not found
 *       500:
 *         description: Failed to fetch weather data
 */
router.post("/get-weather", getWeather);
/**
 * @swagger
 * /api/weather/search-city:
 *   post:
 *     summary: Get Search City
 *     tags: [Weather]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - city
 *             properties:
 *               city:
 *                 type: string
 *     responses:
 *       200:
 *         description: Get Searched City
 *       400:
 *         description: Missing city
 *       404:
 *         description: City not found
 *       500:
 *         description: Failed to fetch Search City
 */
router.post("/search-city", searchCity);
/**
 * @swagger
 * /api/weather/get-current-location:
 *   post:
 *     summary: Get city details from current latitude & longitude
 *     description: Returns the nearest city using reverse geocoding. If city exists in DB cache, returns cached city, otherwise fetches from Open-Meteo and stores it.
 *     tags:
 *       - Weather
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *     responses:
 *       200:
 *         description: Successfully fetched location
 *       400:
 *         description: Missing latitude or longitude
 *       404:
 *         description: City not found for this location
 *       500:
 *         description: Internal server error
 */
router.post("/get-current-location", getCurrentLocation);

export default router;

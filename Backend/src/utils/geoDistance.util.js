'use strict';
/**
 * geoDistance.util.js — Haversine distance calculation
 *
 * Used by:
 * - fraud engine F1 rule: distance between inspection GPS and instrument registered address
 * - assignment service: find nearest officer to an instrument
 *
 * Why haversine and not a Mongo $geoNear query here?
 * For assignment we do use $geoNear. For F1 we compute it in JS because
 * we already have both points in memory at rule-evaluation time and we
 * want the fraud engine to be testable without a DB connection.
 */

const EARTH_RADIUS_METERS = 6_371_000; // Mean Earth radius in meters

/**
 * Calculates the great-circle distance between two points on Earth using
 * the Haversine formula.
 *
 * @param {{ lat: number, lng: number }} point1
 * @param {{ lat: number, lng: number }} point2
 * @returns {number} Distance in meters.
 */
export function haversineDistance(point1, point2) {
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(point2.lat - point1.lat);
  const dLng = toRad(point2.lng - point1.lng);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(point1.lat)) * Math.cos(toRad(point2.lat)) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

/**
 * Extracts { lat, lng } from a GeoJSON Point object (as stored in MongoDB).
 * GeoJSON coordinate order is [longitude, latitude].
 *
 * @param {{ type: string, coordinates: [number, number] }} geoJsonPoint
 * @returns {{ lat: number, lng: number }}
 */
export function geoJsonToLatLng(geoJsonPoint) {
  const [lng, lat] = geoJsonPoint.coordinates;
  return { lat, lng };
}

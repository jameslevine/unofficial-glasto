const EARTH_RADIUS_KM = 6371;
const DETOUR_FACTOR = 1.4;
const WALKING_KMH = 5;

const toRad = (deg: number) => (deg * Math.PI) / 180;

export const greatCircleKm = (
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
): number => {
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
};

export const walkingMinutes = (
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
): number => {
  const km = greatCircleKm(a, b) * DETOUR_FACTOR;
  return Math.round((km / WALKING_KMH) * 60);
};

import prisma from "../db";

interface GeoResult {
  state: string | null;
  county: string | null;
  city: string | null;
}

function roundCoord(val: number, precision = 4): number {
  const factor = Math.pow(10, precision);
  return Math.round(val * factor) / factor;
}

let lastRequestTime = 0;

async function rateLimitedFetch(url: string, headers: Record<string, string>): Promise<Response> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < 1100) {
    await new Promise((r) => setTimeout(r, 1100 - elapsed));
  }
  lastRequestTime = Date.now();
  return fetch(url, { headers });
}

const NYC_BOROUGHS: Record<string, string> = {
  Manhattan: "New York",
  Brooklyn: "Kings",
  Queens: "Queens",
  "The Bronx": "Bronx",
  Bronx: "Bronx",
  "Staten Island": "Richmond",
};

async function fetchFromNominatim(lat: number, lon: number): Promise<GeoResult> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;

  const response = await rateLimitedFetch(url, {
    "User-Agent": "InstantWellnessKitsAdmin/1.0 (hackathon project)",
    "Accept-Language": "en",
  });

  if (!response.ok) {
    throw new Error(`Nominatim returned ${response.status}`);
  }

  const data: any = await response.json();

  if (data.error) {
    throw new Error(`Nominatim error: ${data.error}`);
  }

  const addr = data.address || {};

  let county = (addr.county || "").replace(/\s*County$/i, "").trim() || null;

  const borough = addr.borough || addr.city_district || "";
  if (borough && NYC_BOROUGHS[borough]) {
    county = NYC_BOROUGHS[borough];
  }

  if (!county && (addr.city === "New York" || addr.city === "City of New York")) {
    county = "New York";
  }

  const city = addr.city || addr.town || addr.village || addr.hamlet || null;

  return { state: addr.state || null, county, city };
}

export async function reverseGeocode(lat: number, lon: number): Promise<GeoResult> {
  const rLat = roundCoord(lat);
  const rLon = roundCoord(lon);

  const cached = await prisma.geocodeCache.findUnique({
    where: { latitude_longitude: { latitude: rLat, longitude: rLon } },
  });

  if (cached) {
    return { state: cached.state, county: cached.county, city: cached.city };
  }

  try {
    const result = await fetchFromNominatim(lat, lon);

    await prisma.geocodeCache.upsert({
      where: { latitude_longitude: { latitude: rLat, longitude: rLon } },
      create: {
        latitude: rLat,
        longitude: rLon,
        state: result.state,
        county: result.county,
        city: result.city,
        raw: result as any,
      },
      update: {},
    });

    return result;
  } catch (err) {
    console.error("Geocoding failed for", lat, lon, ":", err);
    return { state: "New York", county: null, city: null };
  }
}

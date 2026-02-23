import { NY_STATE_RATE, NY_COUNTIES, DEFAULT_COUNTY_RATE } from "../data/nyTaxRates";
import { reverseGeocode } from "./geocoding";
import { localReverseGeocode } from "./localGeocoding";

export interface TaxBreakdown {
  state_rate: number;
  county_rate: number;
  city_rate: number;
  special_rates: { name: string; rate: number }[];
}

export interface TaxResult {
  composite_tax_rate: number;
  tax_amount: number;
  total_amount: number;
  breakdown: TaxBreakdown;
  jurisdictions: {
    state: string;
    county: string;
    city: string;
  };
}

function round2(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

export async function calculateTax(lat: number, lon: number, subtotal: number): Promise<TaxResult> {
  const geo = await reverseGeocode(lat, lon);

  const state = geo.state || "New York";
  const county = geo.county || "";
  const city = geo.city || "";

  const stateRate = state === "New York" ? NY_STATE_RATE : 0;

  const countyData = NY_COUNTIES[county];
  let countyRate = countyData ? countyData.rate : DEFAULT_COUNTY_RATE;
  let cityRate = 0;
  let specialRates: { name: string; rate: number }[] = [];

  if (countyData) {
    if (countyData.cities) {
      for (const [cityName, rate] of Object.entries(countyData.cities)) {
        const cityLower = city.toLowerCase().replace(/^city of /i, "");
        const nameLower = cityName.toLowerCase();
        if (cityLower === nameLower || cityLower.includes(nameLower) || nameLower.includes(cityLower)) {
          cityRate = rate;
          break;
        }
      }
    }
    specialRates = countyData.special || [];
  }

  const specialTotal = specialRates.reduce((sum, s) => sum + s.rate, 0);
  const composite_tax_rate = parseFloat((stateRate + countyRate + cityRate + specialTotal).toFixed(6));
  const tax_amount = round2(subtotal * composite_tax_rate);
  const total_amount = round2(subtotal + tax_amount);

  return {
    composite_tax_rate,
    tax_amount,
    total_amount,
    breakdown: {
      state_rate: stateRate,
      county_rate: countyRate,
      city_rate: cityRate,
      special_rates: specialRates,
    },
    jurisdictions: {
      state,
      county: county || "Unknown",
      city: city || "Unknown",
    },
  };
}

/**
 * Fast tax calculation using local centroid-based geocoder.
 * No API calls — runs instantly. Used for bulk import / seed.
 */
export function calculateTaxLocal(lat: number, lon: number, subtotal: number): TaxResult {
  const geo = localReverseGeocode(lat, lon);

  const state = geo.state;
  const county = geo.county;
  const city = geo.city;

  const stateRate = NY_STATE_RATE;

  const countyData = NY_COUNTIES[county];
  let countyRate = countyData ? countyData.rate : DEFAULT_COUNTY_RATE;
  let cityRate = 0;
  let specialRates: { name: string; rate: number }[] = [];

  if (countyData) {
    if (countyData.cities && city) {
      for (const [cityName, rate] of Object.entries(countyData.cities)) {
        const cityLower = city.toLowerCase().replace(/^city of /i, "");
        const nameLower = cityName.toLowerCase();
        if (cityLower === nameLower || cityLower.includes(nameLower) || nameLower.includes(cityLower)) {
          cityRate = rate;
          break;
        }
      }
    }
    specialRates = countyData.special || [];
  }

  const specialTotal = specialRates.reduce((sum, s) => sum + s.rate, 0);
  const composite_tax_rate = parseFloat((stateRate + countyRate + cityRate + specialTotal).toFixed(6));
  const tax_amount = round2(subtotal * composite_tax_rate);
  const total_amount = round2(subtotal + tax_amount);

  return {
    composite_tax_rate,
    tax_amount,
    total_amount,
    breakdown: {
      state_rate: stateRate,
      county_rate: countyRate,
      city_rate: cityRate,
      special_rates: specialRates,
    },
    jurisdictions: {
      state,
      county: county || "Unknown",
      city: city || "Unknown",
    },
  };
}

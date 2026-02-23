export interface CountyTax {
  rate: number;
  cities: Record<string, number>;
  special: { name: string; rate: number }[];
}

export const NY_STATE_RATE = 0.04;

const MCTD: { name: string; rate: number }[] = [
  { name: "Metropolitan Commuter Transportation District", rate: 0.00375 },
];

export const NY_COUNTIES: Record<string, CountyTax> = {
  "New York": { rate: 0.045, cities: { "New York": 0, Manhattan: 0 }, special: MCTD },
  Kings: { rate: 0.045, cities: { Brooklyn: 0, "New York": 0 }, special: MCTD },
  Queens: { rate: 0.045, cities: { Queens: 0, "New York": 0 }, special: MCTD },
  Bronx: { rate: 0.045, cities: { Bronx: 0, "New York": 0, "The Bronx": 0 }, special: MCTD },
  Richmond: { rate: 0.045, cities: { "Staten Island": 0, "New York": 0 }, special: MCTD },
  Nassau: { rate: 0.04625, cities: { "Long Beach": 0, "Glen Cove": 0 }, special: MCTD },
  Suffolk: { rate: 0.04625, cities: {}, special: MCTD },
  Westchester: {
    rate: 0.04,
    cities: { Yonkers: 0.015, "New Rochelle": 0.005, "Mount Vernon": 0.005, "White Plains": 0.005, Peekskill: 0.005, Rye: 0.005 },
    special: MCTD,
  },
  Rockland: { rate: 0.04, cities: {}, special: MCTD },
  Putnam: { rate: 0.04, cities: {}, special: MCTD },
  Dutchess: { rate: 0.0375, cities: {}, special: MCTD },
  Orange: { rate: 0.0375, cities: { Middletown: 0, Newburgh: 0, "Port Jervis": 0 }, special: MCTD },
  Albany: { rate: 0.04, cities: { Albany: 0 }, special: [] },
  Allegany: { rate: 0.04, cities: {}, special: [] },
  Broome: { rate: 0.04, cities: { Binghamton: 0 }, special: [] },
  Cattaraugus: { rate: 0.04, cities: { Olean: 0, Salamanca: 0 }, special: [] },
  Cayuga: { rate: 0.04, cities: { Auburn: 0 }, special: [] },
  Chautauqua: { rate: 0.035, cities: { Dunkirk: 0, Jamestown: 0 }, special: [] },
  Chemung: { rate: 0.04, cities: { Elmira: 0 }, special: [] },
  Chenango: { rate: 0.04, cities: { Norwich: 0 }, special: [] },
  Clinton: { rate: 0.04, cities: { Plattsburgh: 0 }, special: [] },
  Columbia: { rate: 0.04, cities: { Hudson: 0 }, special: [] },
  Cortland: { rate: 0.04, cities: { Cortland: 0 }, special: [] },
  Delaware: { rate: 0.04, cities: {}, special: [] },
  Erie: { rate: 0.04, cities: { Buffalo: 0, Lackawanna: 0, Tonawanda: 0 }, special: [] },
  Essex: { rate: 0.04, cities: {}, special: [] },
  Franklin: { rate: 0.04, cities: {}, special: [] },
  Fulton: { rate: 0.04, cities: { Gloversville: 0, Johnstown: 0 }, special: [] },
  Genesee: { rate: 0.04, cities: { Batavia: 0 }, special: [] },
  Greene: { rate: 0.04, cities: {}, special: [] },
  Hamilton: { rate: 0.04, cities: {}, special: [] },
  Herkimer: { rate: 0.0375, cities: {}, special: [] },
  Jefferson: { rate: 0.04, cities: { Watertown: 0 }, special: [] },
  Lewis: { rate: 0.04, cities: {}, special: [] },
  Livingston: { rate: 0.04, cities: {}, special: [] },
  Madison: { rate: 0.04, cities: { Oneida: 0 }, special: [] },
  Monroe: { rate: 0.04, cities: { Rochester: 0 }, special: [] },
  Montgomery: { rate: 0.04, cities: { Amsterdam: 0 }, special: [] },
  Niagara: { rate: 0.04, cities: { "Niagara Falls": 0, "North Tonawanda": 0, Lockport: 0 }, special: [] },
  Oneida: { rate: 0.0375, cities: { Utica: 0, Rome: 0, Sherrill: 0 }, special: [] },
  Onondaga: { rate: 0.04, cities: { Syracuse: 0 }, special: [] },
  Ontario: { rate: 0.0375, cities: { Canandaigua: 0, Geneva: 0 }, special: [] },
  Orleans: { rate: 0.04, cities: {}, special: [] },
  Oswego: { rate: 0.035, cities: { Fulton: 0, Oswego: 0 }, special: [] },
  Otsego: { rate: 0.04, cities: { Oneonta: 0 }, special: [] },
  Rensselaer: { rate: 0.04, cities: { Troy: 0, Rensselaer: 0 }, special: [] },
  "St. Lawrence": { rate: 0.04, cities: { Ogdensburg: 0 }, special: [] },
  Saratoga: { rate: 0.03, cities: { "Saratoga Springs": 0, Mechanicville: 0 }, special: [] },
  Schenectady: { rate: 0.04, cities: { Schenectady: 0 }, special: [] },
  Schoharie: { rate: 0.04, cities: {}, special: [] },
  Schuyler: { rate: 0.04, cities: {}, special: [] },
  Seneca: { rate: 0.04, cities: {}, special: [] },
  Steuben: { rate: 0.04, cities: { Corning: 0, Hornell: 0 }, special: [] },
  Sullivan: { rate: 0.04, cities: {}, special: [] },
  Tioga: { rate: 0.04, cities: {}, special: [] },
  Tompkins: { rate: 0.04, cities: { Ithaca: 0 }, special: [] },
  Ulster: { rate: 0.04, cities: { Kingston: 0 }, special: [] },
  Warren: { rate: 0.03, cities: { "Glens Falls": 0 }, special: [] },
  Washington: { rate: 0.03, cities: {}, special: [] },
  Wayne: { rate: 0.04, cities: {}, special: [] },
  Wyoming: { rate: 0.04, cities: {}, special: [] },
  Yates: { rate: 0.04, cities: {}, special: [] },
};

export const DEFAULT_COUNTY_RATE = 0.04;

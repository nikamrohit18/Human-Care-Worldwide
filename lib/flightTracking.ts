import { FR24_API_TOKEN } from './fr24Config';

const BASE_URL = 'https://fr24api.flightradar24.com/api/flight-summary/full';

export interface FlightSummary {
  fr24_id: string;
  flight: string;
  callsign: string;
  operated_as: string;
  painted_as: string;
  type: string;
  reg: string;
  orig_icao: string;
  orig_iata: string;
  datetime_takeoff: string | null;
  runway_takeoff: string | null;
  dest_icao: string;
  dest_iata: string;
  dest_icao_actual: string | null;
  dest_iata_actual: string | null;
  datetime_landed: string | null;
  runway_landed: string | null;
  flight_time: number | null;
  actual_distance: number | null;
  circle_distance: number | null;
  category: string;
  hex: string;
  first_seen: string;
  last_seen: string;
  flight_ended: string;
}

function toApiDateTime(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, '');
}

export async function searchFlights(
  flightNumber: string,
  date: Date,
): Promise<FlightSummary[]> {
  const from = new Date(date);
  from.setUTCHours(0, 0, 0, 0);
  const to = new Date(date);
  to.setUTCHours(23, 59, 59, 0);

  const params = new URLSearchParams({
    flights: flightNumber.toUpperCase().replace(/\s/g, ''),
    flight_datetime_from: toApiDateTime(from),
    flight_datetime_to: toApiDateTime(to),
  });

  const response = await fetch(`${BASE_URL}?${params}`, {
    headers: {
      Authorization: `Bearer ${FR24_API_TOKEN}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Invalid API token. Check lib/fr24Config.ts.');
    }
    throw new Error(`FR24 API error: ${response.status}`);
  }

  const json: { data: FlightSummary[] } = await response.json();
  return json.data ?? [];
}

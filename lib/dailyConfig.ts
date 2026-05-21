// ─── Daily.co config ───────────────────────────────────────────────────────
// 1. Sign up free at https://www.daily.co
// 2. Paste your subdomain below  (e.g. if rooms are at humancare.daily.co → 'humancare')
// 3. Get your API key from daily.co dashboard → Developers → API keys
export const DAILY_DOMAIN = 'humancare';

// Your Daily.co API key (keep private — move to a backend server before going live)
export const DAILY_API_KEY = '3c7c12031999d545e6434e787b1ecef8a9459dc49f94ede7934258cb74498778';
// ───────────────────────────────────────────────────────────────────────────

export function isConfigured(): boolean {
  return !DAILY_DOMAIN.startsWith('REPLACE');
}

function roomName(consultationId: string): string {
  return consultationId.replace(/[^a-zA-Z0-9]/g, '-').slice(-20);
}

export function getRoomUrl(consultationId: string): string {
  return `https://${DAILY_DOMAIN}.daily.co/${roomName(consultationId)}`;
}

/** Creates the Daily.co room if it doesn't already exist, then returns its URL. */
export async function ensureRoom(consultationId: string): Promise<string> {
  const name = roomName(consultationId);
  const url = `https://${DAILY_DOMAIN}.daily.co/${name}`;

  if (DAILY_API_KEY.startsWith('REPLACE')) {
    // No API key — return URL anyway; room may already exist in the dashboard
    return url;
  }

  try {
    // Check if room already exists
    const check = await fetch(`https://api.daily.co/v1/rooms/${name}`, {
      headers: { Authorization: `Bearer ${DAILY_API_KEY}` },
    });
    if (check.ok) return url; // room exists

    // Create it
    await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify({ name, privacy: 'public' }),
    });
  } catch {
    // Network error — fall through and try the URL directly
  }

  return url;
}

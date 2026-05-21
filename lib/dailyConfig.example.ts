// Copy this file to lib/dailyConfig.ts and fill in your real values.
// lib/dailyConfig.ts is gitignored so your keys are never committed.
//
// 1. Sign up free at https://www.daily.co
// 2. Your domain is the subdomain shown in your dashboard (e.g. 'humancare')
// 3. API key: Daily.co dashboard → Developers → API keys
export const DAILY_DOMAIN = 'REPLACE_WITH_YOUR_DAILY_DOMAIN';
export const DAILY_API_KEY = 'REPLACE_WITH_YOUR_DAILY_API_KEY';

export function isConfigured(): boolean {
  return !DAILY_DOMAIN.startsWith('REPLACE');
}

function roomName(consultationId: string): string {
  return consultationId.replace(/[^a-zA-Z0-9]/g, '-').slice(-20);
}

export function getRoomUrl(consultationId: string): string {
  return `https://${DAILY_DOMAIN}.daily.co/${roomName(consultationId)}`;
}

export async function ensureRoom(consultationId: string): Promise<string> {
  const name = roomName(consultationId);
  const url = `https://${DAILY_DOMAIN}.daily.co/${name}`;

  if (DAILY_API_KEY.startsWith('REPLACE')) return url;

  try {
    const check = await fetch(`https://api.daily.co/v1/rooms/${name}`, {
      headers: { Authorization: `Bearer ${DAILY_API_KEY}` },
    });
    if (check.ok) return url;

    await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify({ name, privacy: 'public' }),
    });
  } catch {
    // fall through
  }

  return url;
}

const DEFAULT_FONTS = [
  'Inter',
  'Roboto',
  'Poppins',
  'Montserrat',
  'Open Sans',
  'Lato',
  'Oswald',
  'Raleway',
  'Source Sans Pro',
  'Merriweather',
];

let cachedFonts: string[] | null = null;

function getApiKey(): string | undefined {
  try {
    return (import.meta.env.VITE_GOOGLE_FONTS_API_KEY as string | undefined) || undefined;
  } catch {
    return undefined;
  }
}

export async function fetchGoogleFonts(): Promise<string[]> {
  if (cachedFonts) return cachedFonts;
  const key = getApiKey();
  if (!key) {
    cachedFonts = DEFAULT_FONTS;
    return cachedFonts;
  }
  try {
    const res = await fetch(`https://www.googleapis.com/webfonts/v1/webfonts?sort=popularity&key=${key}`);
    if (!res.ok) throw new Error(`Google Fonts API error: ${res.status}`);
    const json = (await res.json()) as { items?: Array<{ family: string }> };
    const list = json.items?.map((f) => f.family).filter(Boolean) ?? [];
    cachedFonts = list.length ? list : DEFAULT_FONTS;
    return cachedFonts;
  } catch (err) {
    console.error(err);
    cachedFonts = DEFAULT_FONTS;
    return cachedFonts;
  }
}

export function loadFont(family: string): void {
  if (!family) return;
  const id = `gf-${family.replace(/\s+/g, '-')}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@400;600;700&display=swap`;
  document.head.appendChild(link);
}



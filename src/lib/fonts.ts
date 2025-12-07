export const DEFAULT_FONTS = [
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
const loadedFonts = new Set<string>();
const loadingFonts = new Map<string, Promise<void>>();

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

/**
 * Load a Google Font and return a Promise that resolves when the font is ready.
 */
export async function loadFont(family: string): Promise<void> {
  if (!family) return;
  
  // Already loaded
  if (loadedFonts.has(family)) return;
  
  // Currently loading - return existing promise
  if (loadingFonts.has(family)) {
    return loadingFonts.get(family);
  }

  const id = `gf-${family.replace(/\s+/g, '-')}`;
  
  // Create loading promise
  const loadPromise = (async () => {
    try {
      // Add stylesheet if not already present
      if (!document.getElementById(id)) {
        const link = document.createElement('link');
        link.id = id;
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@400;600;700&display=swap`;
        document.head.appendChild(link);
      }

      // Wait for the font to actually load using the FontFace API
      if (document.fonts && document.fonts.load) {
        await document.fonts.load(`16px "${family}"`);
      } else {
        // Fallback: wait a bit for older browsers
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      loadedFonts.add(family);
    } catch (err) {
      console.warn(`Failed to load font "${family}":`, err);
      // Still mark as loaded to avoid retrying
      loadedFonts.add(family);
    } finally {
      loadingFonts.delete(family);
    }
  })();

  loadingFonts.set(family, loadPromise);
  return loadPromise;
}

/**
 * Synchronous version that just ensures the stylesheet is added.
 * Use loadFont() for async loading with confirmation.
 */
export function loadFontSync(family: string): void {
  if (!family) return;
  const id = `gf-${family.replace(/\s+/g, '-')}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@400;600;700&display=swap`;
  document.head.appendChild(link);
}

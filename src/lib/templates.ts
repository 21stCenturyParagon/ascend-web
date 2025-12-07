import { getSupabase } from './supabase';

// Types for template configuration
export type TextField = {
  id: string;
  type: 'text';
  key: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontFamily: string;
  fontSize: number;
  fontWeight?: number;
  lineHeight?: number;
  fill: string;
  align: 'left' | 'center' | 'right';
};

export type TableColumn = {
  key: string;
  x: number;
  width: number;
  align: 'left' | 'center' | 'right';
  fontFamily: string;
  fontSize: number;
  fontWeight?: number;
  fill: string;
};

export type RepeatingTable = {
  id: string;
  type: 'repeating-table';
  groupKey: 'leaderboard';
  x: number;
  y: number;
  rowHeight: number;
  rowGap?: number;
  maxRows: number;
  columns: TableColumn[];
};

export type TemplateElement = TextField | RepeatingTable;

export type TemplateConfig = {
  canvas: { width: number; height: number };
  elements: TemplateElement[];
};

export type TemplateRecord = {
  id: string;
  user_id: string;
  name: string;
  width: number;
  height: number;
  background_path: string;
  config: TemplateConfig;
  created_at: string;
  updated_at: string;
};

export type OperationResult<T> = { ok: true; data: T } | { ok: false; error: string };

type UploadResult = OperationResult<{ path: string; publicUrl: string }>;
type SaveTemplateInput = {
  id?: string;
  name: string;
  config: TemplateConfig;
  backgroundPath: string;
};

function randomId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    // ignore and fallback
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function requireUserId(): Promise<OperationResult<{ userId: string }>> {
  const client = getSupabase();
  try {
    const { data, error } = await client.auth.getUser();
    if (error) throw error;
    if (!data.user) {
      return { ok: false, error: 'User not authenticated. Please log in again.' };
    }
    return { ok: true, data: { userId: data.user.id } };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown authentication error';
    return { ok: false, error: message };
  }
}

export function getPublicImageUrl(path: string): string {
  try {
    const client = getSupabase();
    const { data } = client.storage.from('template-images').getPublicUrl(path);
    return data.publicUrl;
  } catch {
    return path;
  }
}

export async function uploadTemplateBackground(file: File): Promise<UploadResult> {
  try {
    const userResult = await requireUserId();
    if (!userResult.ok) return userResult;
    const client = getSupabase();
    const extension = file.name.split('.').pop() || 'png';
    const filePath = `${userResult.data.userId}/${Date.now()}-${randomId()}.${extension}`;
    const { error } = await client.storage.from('template-images').upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });
    if (error) throw error;
    return { ok: true, data: { path: filePath, publicUrl: getPublicImageUrl(filePath) } };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error uploading background image';
    return { ok: false, error: message };
  }
}

export async function saveTemplate(input: SaveTemplateInput): Promise<OperationResult<{ id: string }>> {
  try {
    const userResult = await requireUserId();
    if (!userResult.ok) return userResult;
    const client = getSupabase();
    const payload = {
      id: input.id,
      user_id: userResult.data.userId,
      name: input.name.trim(),
      width: input.config.canvas.width,
      height: input.config.canvas.height,
      background_path: input.backgroundPath,
      config: input.config,
    };

    const { data, error } = await client
      .from('templates')
      .upsert(payload, { onConflict: 'id' })
      .select('id')
      .single();
    if (error) throw error;
    return { ok: true, data: { id: data.id } };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error saving template';
    return { ok: false, error: message };
  }
}

export async function getTemplateById(id: string): Promise<OperationResult<TemplateRecord>> {
  try {
    const client = getSupabase();
    const { data, error } = await client.from('templates').select('*').eq('id', id).single();
    if (error) throw error;
    return { ok: true, data: data as TemplateRecord };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error fetching template';
    return { ok: false, error: message };
  }
}

export async function listTemplates(): Promise<OperationResult<TemplateRecord[]>> {
  try {
    const client = getSupabase();
    const { data, error } = await client.from('templates').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return { ok: true, data: (data ?? []) as TemplateRecord[] };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error loading templates';
    return { ok: false, error: message };
  }
}

// Build a simple example CSV string from the current config.
export function buildExampleCsv(config: TemplateConfig): string {
  const columns = collectRequiredColumns(config);
  const headers = columns.join(',');
  const rows: string[] = [];
  // Provide two sample rows for tables; single fields use first row.
  rows.push(columns.map((col) => `"${col.toUpperCase()} 1"`).join(','));
  rows.push(columns.map((col) => `"${col.toUpperCase()} 2"`).join(','));
  return [headers, ...rows].join('\n');
}

export function collectRequiredColumns(config: TemplateConfig): string[] {
  const set = new Set<string>();
  config.elements.forEach((el) => {
    if (el.type === 'text') {
      set.add(el.key);
    } else if (el.type === 'repeating-table') {
      el.columns.forEach((col) => set.add(col.key));
    }
  });
  return Array.from(set);
}

// Build render-ready data from parsed CSV.
export function mapCsvToTemplateData(config: TemplateConfig, rows: Record<string, string>[]) {
  const singleValues: Record<string, string> = {};
  const tableRows: Record<string, string>[] = [];

  const firstRow = rows[0] || {};
  config.elements.forEach((el) => {
    if (el.type === 'text') {
      singleValues[el.key] = firstRow[el.key] ?? '';
    } else if (el.type === 'repeating-table') {
      const limit = el.maxRows;
      const trimmed = rows.slice(0, limit).map((row) => {
        const entry: Record<string, string> = {};
        el.columns.forEach((col) => {
          entry[col.key] = row[col.key] ?? '';
        });
        return entry;
      });
      tableRows.push(...trimmed);
    }
  });

  return { singleValues, tableRows };
}

// Helper to create a default blank config with given canvas size.
export function createEmptyConfig(width: number, height: number): TemplateConfig {
  return {
    canvas: { width, height },
    elements: [],
  };
}



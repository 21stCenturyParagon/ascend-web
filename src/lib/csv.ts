import Papa, { type ParseError, type ParseResult } from 'papaparse';
import type { TemplateConfig } from './templates';
import { collectRequiredColumns } from './templates';

export type CsvParseResult = {
  headers: string[];
  rows: Record<string, string>[];
};

export type CsvOperationResult<T> = { ok: true; data: T } | { ok: false; error: string };

export async function parseCsvFile(file: File): Promise<CsvOperationResult<CsvParseResult>> {
  try {
    const text = await file.text();
    if (!text.trim()) {
      return { ok: false, error: 'The CSV file is empty.' };
    }
    return await new Promise((resolve) => {
      Papa.parse<Record<string, string>>(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.trim(),
        complete: (results: ParseResult<Record<string, string>>) => {
          if (results.errors.length) {
            const first = results.errors[0];
            resolve({
              ok: false,
              error: `CSV parse error at row ${first.row}: ${first.message}`,
            });
            return;
          }
          const headers = results.meta.fields ?? [];
          resolve({ ok: true, data: { headers, rows: results.data } });
        },
        error: (error: ParseError | Error) => {
          const message = (error as ParseError).message ?? error.message ?? 'CSV parse error';
          resolve({ ok: false, error: message });
        },
      });
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown CSV parse error';
    return { ok: false, error: message };
  }
}

export function validateCsvHeaders(headers: string[], config: TemplateConfig): CsvOperationResult<string[]> {
  try {
    const required = collectRequiredColumns(config);
    const missing = required.filter((col) => !headers.includes(col));
    if (missing.length) {
      return {
        ok: false,
        error: `CSV is missing required column(s): ${missing.join(', ')}.`,
      };
    }
    return { ok: true, data: required };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown CSV validation error';
    return { ok: false, error: message };
  }
}

export function trimRowsToLimit(
  rows: Record<string, string>[],
  maxRows: number,
): CsvOperationResult<Record<string, string>[]> {
  try {
    if (rows.length <= maxRows) {
      return { ok: true, data: rows };
    }
    return {
      ok: false,
      error: `CSV has ${rows.length} rows. Limit is ${maxRows}. Please remove ${rows.length - maxRows} row(s).`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown CSV trim error';
    return { ok: false, error: message };
  }
}

export function extractTableRows(
  rows: Record<string, string>[],
  maxRows: number,
): { withinLimit: Record<string, string>[]; overLimit: Record<string, string>[] } {
  const withinLimit = rows.slice(0, maxRows);
  const overLimit = rows.slice(maxRows);
  return { withinLimit, overLimit };
}

export function deriveMaxRows(config: TemplateConfig): number {
  const columns = config.elements.filter((el) => el.type === 'column') as Array<{ maxRows: number }>;
  if (columns.length === 0) return 0;
  return Math.max(...columns.map((col) => col.maxRows));
}



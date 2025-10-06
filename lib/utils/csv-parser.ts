import { parse } from 'csv-parse/sync';

export async function parseCSV(file: File): Promise<any[]> {
  let text = await file.text();
  
  // Remove comment lines (starting with #) and metadata
  const lines = text.split('\n');
  const cleanedLines = lines.filter(line => {
    const trimmed = line.trim();
    return trimmed.length > 0 && !trimmed.startsWith('#');
  });
  text = cleanedLines.join('\n');
  
  try {
    const records = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true, // Allow variable column counts
    });
    return records;
  } catch (error) {
    throw new Error(`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function normalizeColumnName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, '_');
}

export function findColumn(row: any, possibleNames: string[]): string | undefined {
  const keys = Object.keys(row);
  for (const key of keys) {
    const normalized = normalizeColumnName(key);
    if (possibleNames.includes(normalized)) {
      return key;
    }
  }
  return undefined;
}

export function validateRequiredColumns(
  data: any[],
  requiredColumns: string[][]
): { valid: boolean; missing: string[] } {
  if (!data || data.length === 0) {
    return { valid: false, missing: requiredColumns.map(c => c[0]) };
  }

  const missing: string[] = [];
  const firstRow = data[0];

  for (const columnAliases of requiredColumns) {
    const found = findColumn(firstRow, columnAliases.map(normalizeColumnName));
    if (!found) {
      missing.push(columnAliases[0]);
    }
  }

  return { valid: missing.length === 0, missing };
}

export function getFileValidation(fileName: string): string[][] {
  switch (fileName) {
    case 'grade_book':
      return [
        ['user_id', 'userid', 'uid', 'user'],
        ['total', 'score', 'points'],
      ];
    case 'learners':
      return [
        ['user_id', 'userid', 'uid', 'user'],
        ['first_name', 'firstname', 'first'],
        ['last_name', 'lastname', 'last'],
      ];
    case 'submissions':
      return [
        ['user_id', 'userid', 'uid', 'user'],
        ['step_id', 'stepid', 'step', 'task_id'],
        ['status', 'result'],
      ];
    case 'activity':
      return [
        ['user_id', 'userid', 'uid', 'user'],
        ['timestamp', 'time', 'date'],
      ];
    case 'structure':
      return [
        ['step_id', 'stepid', 'step'],
        ['lesson_id', 'lessonid', 'lesson'],
      ];
    default:
      return [];
  }
}


const TERMINAL_CONTROLS = new RegExp(
  `[${String.fromCharCode(0)}-${String.fromCharCode(8)}${String.fromCharCode(11)}${String.fromCharCode(12)}${String.fromCharCode(14)}-${String.fromCharCode(31)}${String.fromCharCode(127)}]`,
  'g'
);
const FORMULA_PREFIX = /^[=+\-@\t\r]/;

export function stripTerminalControls(value: string): string {
  return value.replace(TERMINAL_CONTROLS, '').replaceAll('\r', '');
}

/**
 * Spreadsheet apps execute cells that start with =, +, -, or @.
 * A leading apostrophe forces the cell to be treated as text.
 */
export function neutralizeSpreadsheetFormula(value: string): string {
  const clean = stripTerminalControls(value);
  if (FORMULA_PREFIX.test(clean)) {
    return `'${clean}`;
  }
  return clean;
}

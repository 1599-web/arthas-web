// @ts-nocheck
// eslint-disable-next-line
export function toReadableValue(unit: string, value: number) {
  if (unit === 'ns') {
    let result = '';
    const ns = value % 1000000;
    value = Math.round(value / 1000000);
    const ms = value % 1000;
    if (ms > 0) result = ms + 'ms';
    value = Math.floor(value / 1000);
    const s = value % 60;
    if (s > 0) result = s + 's ' + result;
    value = Math.floor(value / 60);
    const m = value;
    if (m > 0) result = m.toLocaleString() + 'm ' + result;
    if (result.length === 0) {
      if (ns > 0) return ns + 'ns';
      else return '0ms';
    }
    return result;
  } else if (unit === 'byte') {
    let result = '';
    const bytes = value % 1024;
    value = Math.round(value / 1024);
    const kb = value % 1024;
    if (kb > 0) result = kb + 'KB';
    value = Math.floor(value / 1024);
    const mb = value % 1024;
    if (mb > 0) result = mb + 'MB ' + result;
    value = Math.floor(value / 1024);
    const gb = value % 1024;
    if (gb > 0) result = gb + 'GB ' + result;
    value = Math.floor(value / 1024);
    const tb = value;
    if (tb > 0) result = tb + 'TB ' + result;
    if (result.length === 0) {
      if (bytes == 0) return '0B';
      else return bytes + 'bytes';
    }
    return result;
  } else {
    return value.toLocaleString();
  }
} 
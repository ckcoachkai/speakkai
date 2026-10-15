// Coach-confirmed October 15: Thursday 18:15 class did not start this fall.
// Apply after each read-only Sheet sync so obsolete source bookings cannot return.
export function applyFallScheduleOverrides(sheets) {
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return sheets.map(sheet => {
    const match = /^(\w+) (\d{4})$/.exec(sheet.title);
    if (!match || Number(match[2]) !== 2026) return sheet;
    const month = months.indexOf(match[1]);
    if (month < 9 || month > 11) return sheet;
    return {...sheet, rows:sheet.rows.map(row => ({...row,cells:row.cells.map(cell => {
      const lines = cell.value.split('\n');
      if (!/^\d{1,2}$/.test(lines[0])) return cell;
      const day = Number(lines[0]);
      const date = new Date(Date.UTC(2026,month,day));
      if (date.getUTCMonth() !== month || date.getUTCDay() !== 4 || (month === 9 && day < 15)) return cell;
      return {...cell,value:lines.filter(line=>!/^18:15–20:15 · Class booked(?: · 龙柏)?$/.test(line)).join('\n')};
    })}))};
  });
}

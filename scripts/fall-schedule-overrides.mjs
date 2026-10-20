// Coach-confirmed October 15: Thursday 18:15 class did not start this fall.
// Apply after each read-only Sheet sync so obsolete source bookings cannot return.
export function applyFallScheduleOverrides(sheets) {
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return sheets.map(sheet => {
    const match = /^(\w+) (\d{4})$/.exec(sheet.title);
    if (!match || Number(match[2]) !== 2026) return sheet;
    const month = months.indexOf(match[1]);
    if (month < 8 || month > 11) return sheet;
    return {...sheet, rows:sheet.rows.map(row => ({...row,cells:row.cells.map(cell => {
      const lines = cell.value.split('\n');
      if (!/^\d{1,2}$/.test(lines[0])) return cell;
      const day = Number(lines[0]);
      const date = new Date(Date.UTC(2026,month,day));
      // Coach-confirmed one-off schedule changes, October 20.
      if (month === 9 && day === 20) {
        const kept = lines.filter(line => !/^20:00–21:00 · (?:Yilan Online 1-1|VIP 1-to-1 booked)$/.test(line));
        const event = '20:30–21:30 · Sharing at DPS';
        return {...cell,value:(kept.includes(event) ? kept : [...kept,event]).join('\n')};
      }
      if (month === 10 && day === 14) {
        const event = '10:00–12:00 · Sharing at Zhangjiang Toastmasters Club';
        const kept = lines.filter(line => line !== event);
        const firstEvent = kept.findIndex(line => /^\d{2}:\d{2}/.test(line));
        kept.splice(firstEvent < 0 ? kept.length : firstEvent,0,event);
        lines.splice(0,lines.length,...kept);
      }
      // Coach-confirmed September change, already recorded in the September 19 Sheet.
      if (date.getUTCMonth() === month && date.getUTCDay() === 6 && (month > 8 || day >= 19)) {
        return {...cell,value:lines.map(line=>line.replace(/^15:30–17:30( · (?:古北1699[^\n]*|Class booked · 古北[^\n]*))$/,'15:00–16:30$1').replace(/^17:30–19:30( · (?:古北1699[^\n]*|Class booked · 古北[^\n]*))$/,'16:30–18:30$1')).join('\n')};
      }
      if (date.getUTCMonth() !== month || date.getUTCDay() !== 4 || (month === 9 && day < 15)) return cell;
      return {...cell,value:lines.filter(line=>!/^18:15–20:15 · (?:Class booked(?: · 龙柏)?|井亭大厦[^\n]*|龙柏[^\n]*)$/.test(line)).join('\n')};
    })}))};
  });
}

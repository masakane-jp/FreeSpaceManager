export function formatDate(iso: string): string {
  const [year, month, day] = iso.split('-');
  return `${year}/${month}/${day}`;
}

export function formatDateRange(startIso: string, endIso: string): string {
  if (startIso === endIso) {
    return formatDate(startIso);
  }
  return `${formatDate(startIso)} 〜 ${formatDate(endIso)}`;
}

export function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(date: Date, amount: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

export function buildCalendarWeeks(year: number, monthIndex: number): Date[][] {
  const firstOfMonth = new Date(year, monthIndex, 1);
  const lastOfMonth = new Date(year, monthIndex + 1, 0);
  const gridStart = addDays(firstOfMonth, -firstOfMonth.getDay());

  const weeks: Date[][] = [];
  let cursor = gridStart;
  while (true) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(cursor);
      cursor = addDays(cursor, 1);
    }
    weeks.push(week);
    if (cursor > lastOfMonth) break;
  }
  return weeks;
}

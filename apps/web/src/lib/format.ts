export function formatGHS(pesewas: number): string {
  const ghs = pesewas / 100;
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
  }).format(ghs);
}

export function formatRate(pesewas: number): string {
  return `${formatGHS(pesewas)} / night`;
}

export function formatDate(calendarDate: string): string {
  return new Intl.DateTimeFormat("en-GH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${calendarDate}T00:00:00Z`));
}

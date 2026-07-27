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

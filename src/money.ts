export const money = (value: string) => new Intl.NumberFormat("en-US", {
  style: "currency", currency: "USD",
}).format(Number(value));

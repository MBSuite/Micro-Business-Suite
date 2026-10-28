/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
export function roundThaiTaxAmount(amount: number) {
  return Number((Math.round((Number(amount) + Number.EPSILON) * 100) / 100).toFixed(2));
}

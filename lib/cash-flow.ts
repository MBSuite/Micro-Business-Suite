// Skeleton: Cash Flow module
export interface CashFlowEntry {
  id: number;
  date: string;
  description: string;
  amount: number;
  category: string; // operating / investing / financing
}

// Skeleton: Manufacturing Resource Planning
export interface BOMItem {
  productId: string;
  componentId: string;
  quantity: number;
}

export interface ProductionOrder {
  id: string;
  productId: string;
  quantity: number;
  status: 'planned' | 'in-progress' | 'completed';
}

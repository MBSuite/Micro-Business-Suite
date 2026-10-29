// Skeleton: Custom Forms / Custom Fields mechanism
export interface CustomField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select';
  module: string; // e.g., 'invoice', 'expense', 'journal'
}

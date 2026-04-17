export const TRANSACTION_CATEGORIES = [
  'Alimentação',
  'Transporte',
  'Saúde',
  'Lazer',
  'Trabalho',
  'Salário',
  'Outros',
] as const;

export type TransactionCategory = (typeof TRANSACTION_CATEGORIES)[number];

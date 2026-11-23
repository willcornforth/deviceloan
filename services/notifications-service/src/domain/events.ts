export interface ProductEventData {
  readonly productId: string;
  readonly productName: string;
  readonly serialNumber: string;
  readonly description: string;
  readonly category: string;
  readonly status: string;
  readonly image?: string;
  readonly createdAt: string;
  readonly reservedBy?: string;
  readonly reservedAt?: string;
}

export interface LoanEventData {
  readonly id: string;
  readonly userId: string;
  readonly productId: string;
  readonly dueDate: string;
}

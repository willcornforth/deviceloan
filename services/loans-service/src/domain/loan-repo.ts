import { Loan } from "./loan";

export type LoanId = string;

export interface LoanRepo {
  readonly create: (loan: Loan) => Promise<Loan>;
  readonly getById: (id: LoanId) => Promise<Loan | null>;
  readonly listByUserId: (userId: string) => Promise<readonly Loan[]>;
  readonly listByProductId: (productId: string) => Promise<readonly Loan[]>;
  readonly listPendingApproval: () => Promise<readonly Loan[]>;
  readonly update: (loan: Loan) => Promise<Loan>;
  readonly delete: (id: LoanId) => Promise<void>;
}

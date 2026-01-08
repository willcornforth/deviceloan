// Handle loan created use case - application layer

import { ProductId, loanOutProduct } from '../domain/product';
import { ProductRepo } from '../domain/product-repo';

export interface LoanApprovedEvent {
  readonly id: string;
  readonly userId: string;
  readonly productId: ProductId;
  readonly dueDate: string;
}

export interface HandleLoanApprovedDeps {
  readonly repo: ProductRepo;
  readonly event: LoanApprovedEvent;
}

export interface HandleLoanApprovedSuccess {
  readonly success: true;
  readonly productId: ProductId;
}

export interface HandleLoanApprovedNotFound {
  readonly success: false;
  readonly reason: 'product-not-found';
  readonly productId: ProductId;
}

export interface HandleLoanApprovedAlreadyLoaned {
  readonly success: false;
  readonly reason: 'already-on-loan';
  readonly productId: ProductId;
}

export type HandleLoanApprovedResult =
  | HandleLoanApprovedSuccess
  | HandleLoanApprovedNotFound
  | HandleLoanApprovedAlreadyLoaned;

export const handleLoanApproved = async (
  deps: HandleLoanApprovedDeps
): Promise<HandleLoanApprovedResult> => {
  const { repo, event } = deps;

  const product = await repo.getById(event.productId);

  if (!product) {
    return {
      success: false,
      reason: 'product-not-found',
      productId: event.productId,
    };
  }

  if (product.status === 'on-loan') {
    return {
      success: false,
      reason: 'already-on-loan',
      productId: event.productId,
    };
  }

  const updatedProduct = loanOutProduct(product);
  await repo.update(updatedProduct);

  return { success: true, productId: event.productId };
};

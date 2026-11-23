// Handle loan returned use case - application layer

import { ProductId, returnProduct } from '../domain/product';
import { ProductRepo } from '../domain/product-repo';

export interface LoanReturnedEvent {
  readonly id: string;
  readonly userId: string;
  readonly productId: ProductId;
  readonly dueDate: string;
}

export interface HandleLoanReturnedDeps {
  readonly repo: ProductRepo;
  readonly event: LoanReturnedEvent;
}

export interface HandleLoanReturnedSuccess {
  readonly success: true;
  readonly productId: ProductId;
}

export interface HandleLoanReturnedNotFound {
  readonly success: false;
  readonly reason: 'product-not-found';
  readonly productId: ProductId;
}

export interface HandleLoanReturnedNotOnLoan {
  readonly success: false;
  readonly reason: 'not-on-loan';
  readonly productId: ProductId;
}

export type HandleLoanReturnedResult =
  | HandleLoanReturnedSuccess
  | HandleLoanReturnedNotFound
  | HandleLoanReturnedNotOnLoan;

export const handleLoanReturned = async (
  deps: HandleLoanReturnedDeps
): Promise<HandleLoanReturnedResult> => {
  const { repo, event } = deps;

  const product = await repo.getById(event.productId);

  if (!product) {
    return {
      success: false,
      reason: 'product-not-found',
      productId: event.productId,
    };
  }

  if (product.status !== 'on-loan') {
    return {
      success: false,
      reason: 'not-on-loan',
      productId: event.productId,
    };
  }

  const updatedProduct = returnProduct(product);
  await repo.update(updatedProduct);

  return { success: true, productId: event.productId };
};

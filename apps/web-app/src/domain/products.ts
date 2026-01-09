// Product domain model - immutable and pure

export type ProductId = string;

export type ProductCategory =
  | 'laptop'
  | 'phone'
  | 'tablet'
  | 'monitor'
  | 'accessory';

export type ProductStatus = 'available' | 'reserved' | 'on-loan' | 'maintenance' | 'retired';

export interface Product {
  readonly id: ProductId;
  readonly name: string;
  readonly serialNumber: string;
  readonly description: string;
  readonly category: ProductCategory;
  readonly status: ProductStatus;
  readonly image?: string;
  readonly createdAt: Date;
  readonly _etag?: string;
}

export interface CreateProductParams {
  readonly id: ProductId;
  readonly name: string;
  readonly serialNumber: string;
  readonly description: string;
  readonly category: ProductCategory;
  readonly status?: ProductStatus;
  readonly image?: string;
}

export interface ValidationError {
  readonly field: string;
  readonly message: string;
}

export type ProductResult =
  | { readonly success: true; readonly product: Product }
  | { readonly success: false; readonly errors: readonly ValidationError[] };

// Validation helpers
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isValidCategory = (value: unknown): value is ProductCategory =>
  typeof value === 'string' &&
  ['laptop', 'phone', 'tablet', 'monitor', 'accessory'].includes(value);

const validateProductParams = (
  params: CreateProductParams
): readonly ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!isNonEmptyString(params.id)) {
    errors.push({
      field: 'id',
      message: 'Product ID is required and must be a non-empty string',
    });
  }

  if (!isNonEmptyString(params.name)) {
    errors.push({
      field: 'name',
      message: 'Product name is required and must be a non-empty string',
    });
  }

  if (!isNonEmptyString(params.serialNumber)) {
    errors.push({
      field: 'serialNumber',
      message: 'Serial number is required and must be a non-empty string',
    });
  }

  if (!isNonEmptyString(params.description)) {
    errors.push({
      field: 'description',
      message: 'Product description is required and must be a non-empty string',
    });
  }

  if (!isValidCategory(params.category)) {
    errors.push({
      field: 'category',
      message:
        'Product category must be one of: laptop, phone, tablet, monitor, accessory',
    });
  }

  return errors;
};

// Factory function - pure and immutable
export const createProduct = (params: CreateProductParams): ProductResult => {
  const errors = validateProductParams(params);

  if (errors.length > 0) {
    return { success: false, errors };
  }

  const product: Product = {
    id: params.id.trim(),
    name: params.name.trim(),
    serialNumber: params.serialNumber.trim(),
    description: params.description.trim(),
    category: params.category,
    status: params.status ?? 'available',
    image: params.image,
    createdAt: new Date(),
  };

  return { success: true, product };
};

// Pure utility functions
export const isProductAvailable = (product: Product): boolean =>
  product.status === 'available';

export const loanOutProduct = (product: Product): Product => ({
  ...product,
  status: 'on-loan',
});

export const returnProduct = (product: Product): Product => ({
  ...product,
  status: 'available',
});

export const updateProductDescription = (
  product: Product,
  description: string
): Product => ({
  ...product,
  description: description.trim(),
});

import {
  CreateLoanInput,
  CreateLoanOutput,
  ListLoansInput,
  ListLoansOutput,
  ReturnLoanInput,
  ReturnLoanOutput,
  ListPendingApprovalsOutput,
  ListActiveLoansOutput,
  ApproveLoanInput,
  ApproveLoanOutput,
  RejectLoanInput,
  RejectLoanOutput,
  LoanService
} from "../app/loan-service";
import { withErrorHandling } from "./service-error-handler";

export class HttpLoanService implements LoanService {
  constructor(private readonly token: string) {}

  async listLoans(input: ListLoansInput): Promise<ListLoansOutput> {
    const baseUrl = import.meta.env.DEV
      ? "/api"
      : import.meta.env.VITE_API_GATEWAY_BASE_URL;

    if (!baseUrl) {
      throw new Error(
        "Missing API Gateway base URL configuration. Please check your environment variables."
      );
    }

    if (!input.userId) {
      throw new Error("User ID is required to list loans");
    }

    const response = await withErrorHandling<{ data: unknown[] }>(
      () => fetch(`${baseUrl}/users/${input.userId}/loans`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
      }),
      { operation: 'list loans', resource: 'your loans' }
    );

    return {
      loans: response.data,
    };
  }

  async createLoan(input: CreateLoanInput): Promise<CreateLoanOutput> {
    // In development, use relative path to leverage Vite proxy and avoid CORS
    const baseUrl = import.meta.env.DEV
      ? "/api"
      : import.meta.env.VITE_API_GATEWAY_BASE_URL;

    if (!baseUrl) {
      throw new Error(
        "Missing API Gateway base URL configuration. Please check your environment variables."
      );
    }

    const response = await withErrorHandling<{ data: { message: string; product: unknown }; message?: string }>(
      () => fetch(`${baseUrl}/products/${input.productId}/reserve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          returnDate: input.returnDate.toISOString(),
        }),
      }),
      { operation: 'reserve product', resource: 'this device' }
    );

    const responseData = response.data;
    return {
      product: responseData.product,
      message: responseData.message || response.message,
    };
  }

  async returnLoan(input: ReturnLoanInput): Promise<ReturnLoanOutput> {
    const baseUrl = import.meta.env.DEV
      ? "/api"
      : import.meta.env.VITE_API_GATEWAY_BASE_URL;

    if (!baseUrl) {
      throw new Error(
        "Missing API Gateway base URL configuration. Please check your environment variables."
      );
    }

    const response = await withErrorHandling<{ data: unknown }>(
      () => fetch(`${baseUrl}/loans/${input.loanId}/return`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
      }),
      { operation: 'return loan', resource: 'this loan' }
    );

    return {
      loan: {
        ...response.data,
      },
    };
  }

  async listPendingApprovals(): Promise<ListPendingApprovalsOutput> {
    const baseUrl = import.meta.env.DEV
      ? "/api"
      : import.meta.env.VITE_API_GATEWAY_BASE_URL;

    if (!baseUrl) {
      throw new Error(
        "Missing API Gateway base URL configuration. Please check your environment variables."
      );
    }

    const response = await withErrorHandling<{ data: unknown[] }>(
      () => fetch(`${baseUrl}/loans/status/pending-approval`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
      }),
      { operation: 'list pending approvals', resource: 'pending loan approvals' }
    );

    return {
      loans: response.data,
    };
  }

  async listActiveLoans(): Promise<ListActiveLoansOutput> {
    const baseUrl = import.meta.env.DEV
      ? "/api"
      : import.meta.env.VITE_API_GATEWAY_BASE_URL;

    if (!baseUrl) {
      throw new Error(
        "Missing API Gateway base URL configuration. Please check your environment variables."
      );
    }

    const response = await withErrorHandling<{ data: unknown[] }>(
      () => fetch(`${baseUrl}/loans/status/active`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
      }),
      { operation: 'list active loans', resource: 'active loans' }
    );

    return {
      loans: response.data,
    };
  }

  async approveLoan(input: ApproveLoanInput): Promise<ApproveLoanOutput> {
    const baseUrl = import.meta.env.DEV
      ? "/api"
      : import.meta.env.VITE_API_GATEWAY_BASE_URL;

    if (!baseUrl) {
      throw new Error(
        "Missing API Gateway base URL configuration. Please check your environment variables."
      );
    }

    const response = await withErrorHandling<{ data: unknown }>(
      () => fetch(`${baseUrl}/loans/${input.loanId}/approve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
      }),
      { operation: 'approve loan', resource: 'this loan' }
    );

    return {
      loan: response.data,
    };
  }

  async rejectLoan(input: RejectLoanInput): Promise<RejectLoanOutput> {
    const baseUrl = import.meta.env.DEV
      ? "/api"
      : import.meta.env.VITE_API_GATEWAY_BASE_URL;

    if (!baseUrl) {
      throw new Error(
        "Missing API Gateway base URL configuration. Please check your environment variables."
      );
    }

    const response = await withErrorHandling<{ data: unknown }>(
      () => fetch(`${baseUrl}/loans/${input.loanId}/reject`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
      }),
      { operation: 'reject loan', resource: 'this loan' }
    );

    return {
      loan: response.data,
    };
  }
}

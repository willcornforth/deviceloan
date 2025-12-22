import {
  CreateLoanInput,
  CreateLoanOutput,
  ListLoansInput,
  ListLoansOutput,
  ReturnLoanInput,
  ReturnLoanOutput,
  ListPendingApprovalsOutput,
  ApproveLoanInput,
  ApproveLoanOutput,
  RejectLoanInput,
  RejectLoanOutput,
  LoanService
} from "../app/loan-service";

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

    const response = await fetch(`${baseUrl}/users/${input.userId}/loans`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: response.statusText }));
      throw new Error(
        `Failed to list loans: ${errorData.message || response.statusText}`
      );
    }

    const json = await response.json();
    const loansData = json.data;

    return {
      loans: loansData,
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

    const response = await fetch(`${baseUrl}/products/${input.productId}/reserve`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        returnDate: input.returnDate.toISOString(),
      }),
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: response.statusText }));
      throw new Error(
        `Failed to create loan: ${errorData.message || response.statusText}`
      );
    }

    const json = await response.json();

    // The reserve endpoint returns the reserved product, not a loan
    // The loan will be created asynchronously via event handlers
    const productData = json.product;
    return {
      product: productData,
      message: json.message,
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

    const response = await fetch(`${baseUrl}/loans/${input.loanId}/return`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: response.statusText }));
      throw new Error(
        `Failed to return loan: ${errorData.message || response.statusText}`
      );
    }

    const json = await response.json();
    const loanData = json.data;

    return {
      loan: {
        ...loanData,
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

    const response = await fetch(`${baseUrl}/loans/status/pending-approval`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: response.statusText }));
      throw new Error(
        `Failed to list pending approvals: ${errorData.message || response.statusText}`
      );
    }

    const json = await response.json();
    return {
      loans: json.data,
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

    const response = await fetch(`${baseUrl}/loans/${input.loanId}/approve`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: response.statusText }));
      throw new Error(
        `Failed to approve loan: ${errorData.message || response.statusText}`
      );
    }

    const json = await response.json();
    return {
      loan: json.data,
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

    const response = await fetch(`${baseUrl}/loans/${input.loanId}/reject`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: response.statusText }));
      throw new Error(
        `Failed to reject loan: ${errorData.message || response.statusText}`
      );
    }

    const json = await response.json();
    return {
      loan: json.data,
    };
  }
}

import {
  CreateLoanInput,
  CreateLoanOutput,
  ListLoansInput,
  ListLoansOutput,
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

    const response = await fetch(`${baseUrl}/loans`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productId: input.productId,
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

    // Convert date strings back to Date objects
    const loanData = json.data;
    return {
      loan: {
        ...loanData,
      },
    };
  }
}

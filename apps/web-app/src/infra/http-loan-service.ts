import {
  CreateLoanInput,
  CreateLoanOutput,
  LoanService,
  ListLoansInput,
  ListLoansOutput,
  GetLoanInput,
  GetLoanOutput,
  ReturnLoanInput,
  ReturnLoanOutput,
} from "../app/loan-service";

export class HttpLoanService implements LoanService {
  constructor(private readonly token: string) {}

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

  async listLoans(_input?: ListLoansInput): Promise<ListLoansOutput> {
    throw new Error("Method not implemented.");
  }

  async getLoan(_input: GetLoanInput): Promise<GetLoanOutput> {
    throw new Error("Method not implemented.");
  }

  async returnLoan(_input: ReturnLoanInput): Promise<ReturnLoanOutput> {
    throw new Error("Method not implemented.");
  }
}

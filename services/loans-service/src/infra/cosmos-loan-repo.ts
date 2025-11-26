import { Container, CosmosClient } from "@azure/cosmos";
import { Loan } from "../domain/loan";
import { LoanId, LoanRepo } from "../domain/loan-repo";

export interface CosmosLoanRepoOptions {
  endpoint: string;
  key?: string;
  databaseId: string;
  containerId: string;
}

interface LoanDocument {
  id: string;
  productId: string;
  userId: string;
  status: string;
  loanDate: string;
  dueDate: string;
  returnDate?: string;
  createdAt: string;
  updatedAt: string;
}

const toLoanDocument = (loan: Loan): LoanDocument => ({
  id: loan.id,
  productId: loan.productId,
  userId: loan.userId,
  status: loan.status,
  loanDate: loan.loanDate.toISOString(),
  dueDate: loan.dueDate.toISOString(),
  returnDate: loan.returnDate?.toISOString(),
  createdAt: loan.createdAt.toISOString(),
  updatedAt: loan.updatedAt.toISOString(),
});

const toLoan = (doc: LoanDocument): Loan => ({
  id: doc.id,
  productId: doc.productId,
  userId: doc.userId,
  status: doc.status as Loan["status"],
  loanDate: new Date(doc.loanDate),
  dueDate: new Date(doc.dueDate),
  returnDate: doc.returnDate ? new Date(doc.returnDate) : undefined,
  createdAt: new Date(doc.createdAt),
  updatedAt: new Date(doc.updatedAt),
});

export class CosmosLoanRepo implements LoanRepo {
  private readonly container: Container;

  constructor(options: CosmosLoanRepoOptions) {
    const clientOptions = options.key
      ? { endpoint: options.endpoint, key: options.key }
      : { endpoint: options.endpoint };

    const client = new CosmosClient(clientOptions);
    this.container = client
      .database(options.databaseId)
      .container(options.containerId);
  }

  async create(loan: Loan): Promise<Loan> {
    const document = toLoanDocument(loan);
    const { resource } = await this.container.items.create(document);
    return toLoan(resource as LoanDocument);
  }

  async getById(id: LoanId): Promise<Loan | null> {
    try {
      const { resource } = await this.container
        .item(id, id)
        .read<LoanDocument>();
      return resource ? toLoan(resource) : null;
    } catch (error: unknown) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === 404
      ) {
        return null;
      }
      throw error;
    }
  }

  async listByUserId(userId: string): Promise<readonly Loan[]> {
    const { resources } = await this.container.items
      .query<LoanDocument>({
        query: "SELECT * FROM c WHERE c.userId = @userId",
        parameters: [{ name: "@userId", value: userId }],
      })
      .fetchAll();
    return resources.map(toLoan);
  }

  async listByProductId(productId: string): Promise<readonly Loan[]> {
    const { resources } = await this.container.items
      .query<LoanDocument>({
        query: "SELECT * FROM c WHERE c.productId = @productId",
        parameters: [{ name: "@productId", value: productId }],
      })
      .fetchAll();
    return resources.map(toLoan);
  }

  async listPendingApproval(): Promise<readonly Loan[]> {
    const { resources } = await this.container.items
      .query<LoanDocument>({
        query: "SELECT * FROM c WHERE c.status = @status",
        parameters: [{ name: "@status", value: "PendingApproval" }],
      })
      .fetchAll();
    return resources.map(toLoan);
  }

  async update(loan: Loan): Promise<Loan> {
    const document = toLoanDocument(loan);
    const { resource } = await this.container
      .item(loan.id, loan.id)
      .replace(document);
    return toLoan(resource as LoanDocument);
  }

  async delete(id: LoanId): Promise<void> {
    await this.container.item(id, id).delete();
  }
}

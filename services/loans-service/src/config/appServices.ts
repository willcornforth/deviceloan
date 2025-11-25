import { LoanRepo } from "../domain/loan-repo";
import { CosmosLoanRepo } from "../infra/cosmos-loan-repo";

let loanRepoInstance: LoanRepo | null = null;

export const getLoanRepo = (): LoanRepo => {
  if (!loanRepoInstance) {
    const endpoint = process.env.COSMOS_ENDPOINT;
    const key = process.env.COSMOS_KEY;
    const databaseId = process.env.COSMOS_DATABASE_ID;
    const containerId = process.env.COSMOS_CONTAINER_ID;

    if (!endpoint) {
      throw new Error("Missing required environment variable: COSMOS_ENDPOINT");
    }

    if (!databaseId) {
      throw new Error("Missing required environment variable: COSMOS_DATABASE_ID");
    }

    if (!containerId) {
      throw new Error("Missing required environment variable: COSMOS_CONTAINER_ID");
    }

    loanRepoInstance = new CosmosLoanRepo({
      endpoint,
      key,
      databaseId,
      containerId,
    });
  }

  return loanRepoInstance;
};

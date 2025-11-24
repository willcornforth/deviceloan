import { LoanRepo } from "../domain/loan-repo";
import { CosmosLoanRepo } from "../infra/cosmos-loan-repo";

let loanRepoInstance: LoanRepo | null = null;

export const getLoanRepo = (): LoanRepo => {
  if (!loanRepoInstance) {
    const endpoint = process.env.COSMOS_ENDPOINT;
    const key = process.env.COSMOS_KEY;
    const databaseId = process.env.COSMOS_DATABASE_ID;
    const containerId = process.env.COSMOS_LOANS_CONTAINER_ID;

    if (!endpoint || !databaseId || !containerId) {
      throw new Error(
        "Missing required environment variables: COSMOS_ENDPOINT, COSMOS_DATABASE_ID, COSMOS_LOANS_CONTAINER_ID"
      );
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

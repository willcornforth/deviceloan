import { app, EventGridEvent, InvocationContext } from "@azure/functions";
import { createLoan } from "../app/createLoan";
import { getLoanRepo } from "../config/appServices";
import { CreateLoanRequest } from "../domain/loan";
import { loanEventPublisher } from "../infra/eventgrid-loans-publisher";

export interface ProductReservedEventData {
  readonly productId: string;
  readonly productName: string;
  readonly serialNumber: string;
  readonly category: string;
  readonly reservedBy: string;
  readonly reservedAt: string;
  readonly returnDate: string;
}

async function handler(
  event: EventGridEvent,
  context: InvocationContext
): Promise<void> {
  context.log("Received Product.Reserved event:", event.id);

  const data = event.data as unknown as ProductReservedEventData;

  if (!data.productId || !data.reservedBy) {
    context.error("Invalid event data - missing productId or reservedBy");
    return;
  }

  try {
    // Use returnDate from event, or default to 2 days from reservation
    const dueDate = data.returnDate
      ? new Date(data.returnDate)
      : (() => {
          const date = new Date(data.reservedAt);
          date.setDate(date.getDate() + 2);
          return date;
        })();

    const createLoanRequest: CreateLoanRequest = {
      productId: data.productId,
      userId: data.reservedBy,
      dueDate,
    };

    const repo = getLoanRepo();
    const loan = await createLoan(repo)(createLoanRequest);

    context.log(
      `Created loan ${loan.id} for product ${data.productId} reserved by ${data.reservedBy}`
    );
  } catch (error) {
    context.error("Error creating loan from Product.Reserved event:", error);

    // Publish Loan.CreationFailed event to unreserve the product
    // IMPORTANT: Once we publish this event, we must NOT retry the loan creation
    // as the product will be unreserved by the product service
    try {
      await loanEventPublisher.publishLoanCreationFailed(
        {
          productId: data.productId,
          userId: data.reservedBy,
          reason: error instanceof Error ? error.message : "Unknown error",
        },
        context
      );
      // Successfully published failure event - do NOT retry
      context.log(
        `Published Loan.CreationFailed for product ${data.productId}, not retrying`
      );
      return;
    } catch (publishError) {
      // Failed to publish the failure event - safe to retry the whole operation
      context.error("Failed to publish Loan.CreationFailed event:", publishError);
      throw error; // Rethrow to trigger retry
    }
  }
}

app.eventGrid("productReservedEventHandler", {
  handler,
});

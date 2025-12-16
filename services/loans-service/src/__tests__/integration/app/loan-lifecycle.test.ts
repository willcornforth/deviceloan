// End-to-end integration tests for loan lifecycle
// These tests require Cosmos DB and validate complete workflows

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { CosmosLoanRepo } from '../../../infra/cosmos-loan-repo';
import { createLoan } from '../../../app/createLoan';
import { approveLoan } from '../../../app/approveLoan';
import { returnLoan } from '../../../app/returnLoan';
import { rejectLoan } from '../../../app/rejectLoan';
import { getLoanById } from '../../../app/getLoanById';
import { listLoansByUserId } from '../../../app/listLoansByUserId';
import { listPendingApprovalLoans } from '../../../app/listPendingApprovalLoans';
import { LoanStatus } from '../../../domain/loan';
import { CosmosClient } from '@azure/cosmos';

// Check if Cosmos DB is available
const isCosmosAvailable = async () => {
	try {
		const endpoint =
			process.env.COSMOS_ENDPOINT ||
			'https://localhost:8081';
		const key =
			process.env.COSMOS_KEY ||
			'C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==';

		const client = new CosmosClient({ endpoint, key });
		await client.getDatabaseAccount();
		return true;
	} catch {
		return false;
	}
};

describe.skipIf(!(await isCosmosAvailable()))(
	'Loan Lifecycle Integration Tests',
	() => {
		let repo: CosmosLoanRepo;
		const testDatabaseId = 'TestLoansLifecycleDB';
		const testContainerId = 'TestLoansLifecycle';

		beforeAll(async () => {
			const endpoint =
				process.env.COSMOS_ENDPOINT ||
				'https://localhost:8081';
			const key =
				process.env.COSMOS_KEY ||
				'C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==';

			// Create test database and container
			const client = new CosmosClient({ endpoint, key });
			const { database } = await client.databases.createIfNotExists({
				id: testDatabaseId,
			});
			await database.containers.createIfNotExists({
				id: testContainerId,
				partitionKey: { paths: ['/id'] },
			});

			repo = new CosmosLoanRepo({
				endpoint,
				key,
				databaseId: testDatabaseId,
				containerId: testContainerId,
			});
		});

		afterAll(async () => {
			// Clean up test database
			const endpoint =
				process.env.COSMOS_ENDPOINT ||
				'https://localhost:8081';
			const key =
				process.env.COSMOS_KEY ||
				'C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==';

			const client = new CosmosClient({ endpoint, key });
			await client.database(testDatabaseId).delete();
		});

		it('should complete a full loan approval and return lifecycle', async () => {
			const createLoanUseCase = createLoan(repo);
			const approveLoanUseCase = approveLoan(repo);
			const returnLoanUseCase = returnLoan(repo);
			const getLoanByIdUseCase = getLoanById(repo);

			// Create loan
			const newLoan = await createLoanUseCase({
				productId: 'prod-123',
				userId: 'user-456',
				loanDate: new Date('2025-01-01'),
				dueDate: new Date('2025-12-31'),
			});

			expect(newLoan.status).toBe(LoanStatus.PendingApproval);

			// Approve loan
			const approvedLoan = await approveLoanUseCase(newLoan.id);

			expect(approvedLoan).not.toBeNull();
			expect(approvedLoan!.status).toBe(LoanStatus.Active);

			// Verify approval persisted
			const activeLoan = await getLoanByIdUseCase(newLoan.id);
			expect(activeLoan!.status).toBe(LoanStatus.Active);

			// Return loan
			const returnedLoan = await returnLoanUseCase(newLoan.id);

			expect(returnedLoan).not.toBeNull();
			expect(returnedLoan!.status).toBe(LoanStatus.Returned);
			expect(returnedLoan!.returnDate).toBeDefined();

			// Verify return persisted
			const finalLoan = await getLoanByIdUseCase(newLoan.id);
			expect(finalLoan!.status).toBe(LoanStatus.Returned);
			expect(finalLoan!.returnDate).toBeDefined();
		});

		it('should complete a loan rejection workflow', async () => {
			const createLoanUseCase = createLoan(repo);
			const rejectLoanUseCase = rejectLoan(repo);
			const getLoanByIdUseCase = getLoanById(repo);

			// Create loan
			const newLoan = await createLoanUseCase({
				productId: 'prod-456',
				userId: 'user-789',
				loanDate: new Date('2025-02-01'),
				dueDate: new Date('2025-12-31'),
			});

			expect(newLoan.status).toBe(LoanStatus.PendingApproval);

			// Reject loan
			const rejectedLoan = await rejectLoanUseCase(newLoan.id);

			expect(rejectedLoan).not.toBeNull();
			expect(rejectedLoan!.status).toBe(LoanStatus.Rejected);

			// Verify rejection persisted
			const finalLoan = await getLoanByIdUseCase(newLoan.id);
			expect(finalLoan!.status).toBe(LoanStatus.Rejected);
		});

		it('should list loans by userId correctly', async () => {
			const createLoanUseCase = createLoan(repo);
			const listLoansByUserIdUseCase = listLoansByUserId(repo);
			const userId = `user-${Date.now()}`;

			// Create multiple loans for the same user
			const loan1 = await createLoanUseCase({
				productId: 'prod-1',
				userId,
				loanDate: new Date('2025-01-01'),
				dueDate: new Date('2025-06-30'),
			});

			const loan2 = await createLoanUseCase({
				productId: 'prod-2',
				userId,
				loanDate: new Date('2025-02-01'),
				dueDate: new Date('2025-07-31'),
			});

			// List loans for the user
			const userLoans = await listLoansByUserIdUseCase(userId);

			expect(userLoans.length).toBeGreaterThanOrEqual(2);
			expect(userLoans.some((l) => l.id === loan1.id)).toBe(true);
			expect(userLoans.some((l) => l.id === loan2.id)).toBe(true);
		});

		it('should list pending approval loans correctly', async () => {
			const createLoanUseCase = createLoan(repo);
			const listPendingApprovalLoansUseCase =
				listPendingApprovalLoans(repo);

			// Create a pending loan
			const newLoan = await createLoanUseCase({
				productId: `prod-${Date.now()}`,
				userId: `user-${Date.now()}`,
				loanDate: new Date('2025-03-01'),
				dueDate: new Date('2025-12-31'),
			});

			// List pending approvals
			const pendingLoans = await listPendingApprovalLoansUseCase();

			expect(pendingLoans.length).toBeGreaterThanOrEqual(1);
			expect(
				pendingLoans.some(
					(l) =>
						l.id === newLoan.id &&
						l.status === LoanStatus.PendingApproval
				)
			).toBe(true);
		});

		it('should handle concurrent loan operations', async () => {
			const createLoanUseCase = createLoan(repo);
			const approveLoanUseCase = approveLoan(repo);
			const userId = `user-${Date.now()}`;

			// Create multiple loans concurrently
			const loanPromises = [
				createLoanUseCase({
					productId: 'prod-1',
					userId,
					loanDate: new Date('2025-01-01'),
					dueDate: new Date('2025-06-30'),
				}),
				createLoanUseCase({
					productId: 'prod-2',
					userId,
					loanDate: new Date('2025-02-01'),
					dueDate: new Date('2025-07-31'),
				}),
				createLoanUseCase({
					productId: 'prod-3',
					userId,
					loanDate: new Date('2025-03-01'),
					dueDate: new Date('2025-08-31'),
				}),
			];

			const loans = await Promise.all(loanPromises);

			expect(loans.length).toBe(3);
			expect(loans.every((l) => l.status === LoanStatus.PendingApproval)).toBe(
				true
			);

			// Approve all loans concurrently
			const approvalPromises = loans.map((l) =>
				approveLoanUseCase(l.id)
			);
			const approvedLoans = await Promise.all(approvalPromises);

			expect(
				approvedLoans.every((l) => l && l.status === LoanStatus.Active)
			).toBe(true);
		});
	}
);

// Integration tests for CosmosLoanRepo
// These tests require a running Cosmos DB Emulator or Azure Cosmos DB instance

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { CosmosLoanRepo } from '../../../infra/cosmos-loan-repo';
import { Loan, LoanStatus } from '../../../domain/loan';
import { CosmosClient } from '@azure/cosmos';

// Check if Cosmos DB is available
const isCosmosAvailable = async () => {
	try {
		const endpoint =
			process.env.COSMOS_ENDPOINT ||
			'https://localhost:8081';
		const key =
			process.env.COSMOS_KEY ||
			'KEY';

		const client = new CosmosClient({ endpoint, key });
		await client.getDatabaseAccount();
		return true;
	} catch {
		return false;
	}
};

describe.skipIf(!(await isCosmosAvailable()))(
	'CosmosLoanRepo Integration Tests',
	() => {
		let repo: CosmosLoanRepo;
		const testDatabaseId = 'TestLoansDB';
		const testContainerId = 'TestLoans';

		beforeAll(async () => {
			const endpoint =
				process.env.COSMOS_ENDPOINT ||
				'https://localhost:8081';
			const key =
				process.env.COSMOS_KEY ||
				'KEY';

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
				'KEY';

			const client = new CosmosClient({ endpoint, key });
			await client.database(testDatabaseId).delete();
		});

		it('should create a loan in Cosmos DB', async () => {
			const loan: Loan = {
				id: `loan-${Date.now()}-1`,
				productId: 'prod-123',
				userId: 'user-456',
				status: LoanStatus.PendingApproval,
				loanDate: new Date('2025-01-01'),
				dueDate: new Date('2025-12-31'),
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const created = await repo.create(loan);

			expect(created.id).toBe(loan.id);
			expect(created.productId).toBe(loan.productId);
			expect(created.userId).toBe(loan.userId);
			expect(created.status).toBe(LoanStatus.PendingApproval);
		});

		it('should retrieve a loan by id', async () => {
			const loan: Loan = {
				id: `loan-${Date.now()}-2`,
				productId: 'prod-123',
				userId: 'user-456',
				status: LoanStatus.Active,
				loanDate: new Date('2025-01-01'),
				dueDate: new Date('2025-12-31'),
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			await repo.create(loan);
			const retrieved = await repo.getById(loan.id);

			expect(retrieved).not.toBeNull();
			expect(retrieved!.id).toBe(loan.id);
			expect(retrieved!.status).toBe(LoanStatus.Active);
		});

		it('should return null for non-existent loan', async () => {
			const retrieved = await repo.getById('non-existent-id');

			expect(retrieved).toBeNull();
		});

		it('should update a loan', async () => {
			const loan: Loan = {
				id: `loan-${Date.now()}-3`,
				productId: 'prod-123',
				userId: 'user-456',
				status: LoanStatus.Active,
				loanDate: new Date('2025-01-01'),
				dueDate: new Date('2025-12-31'),
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const created = await repo.create(loan);
			const updated = await repo.update({
				...created,
				status: LoanStatus.Returned,
				returnDate: new Date(),
				updatedAt: new Date(),
			});

			expect(updated.status).toBe(LoanStatus.Returned);
			expect(updated.returnDate).toBeDefined();
		});

		it('should delete a loan', async () => {
			const loan: Loan = {
				id: `loan-${Date.now()}-4`,
				productId: 'prod-123',
				userId: 'user-456',
				status: LoanStatus.PendingApproval,
				loanDate: new Date('2025-01-01'),
				dueDate: new Date('2025-12-31'),
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			await repo.create(loan);
			await repo.delete(loan.id);

			const retrieved = await repo.getById(loan.id);
			expect(retrieved).toBeNull();
		});

		it('should list loans by userId', async () => {
			const userId = `user-${Date.now()}`;
			const loan1: Loan = {
				id: `loan-${Date.now()}-5`,
				productId: 'prod-1',
				userId,
				status: LoanStatus.Active,
				loanDate: new Date('2025-01-01'),
				dueDate: new Date('2025-12-31'),
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			const loan2: Loan = {
				id: `loan-${Date.now()}-6`,
				productId: 'prod-2',
				userId,
				status: LoanStatus.Returned,
				loanDate: new Date('2024-01-01'),
				dueDate: new Date('2024-12-31'),
				returnDate: new Date('2024-12-15'),
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			await repo.create(loan1);
			await repo.create(loan2);

			const loans = await repo.listByUserId(userId);

			expect(loans.length).toBeGreaterThanOrEqual(2);
			expect(loans.some((l) => l.id === loan1.id)).toBe(true);
			expect(loans.some((l) => l.id === loan2.id)).toBe(true);
		});

		it('should list loans by productId', async () => {
			const productId = `prod-${Date.now()}`;
			const loan1: Loan = {
				id: `loan-${Date.now()}-7`,
				productId,
				userId: 'user-1',
				status: LoanStatus.Active,
				loanDate: new Date('2025-01-01'),
				dueDate: new Date('2025-12-31'),
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			const loan2: Loan = {
				id: `loan-${Date.now()}-8`,
				productId,
				userId: 'user-2',
				status: LoanStatus.Returned,
				loanDate: new Date('2024-01-01'),
				dueDate: new Date('2024-12-31'),
				returnDate: new Date('2024-12-15'),
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			await repo.create(loan1);
			await repo.create(loan2);

			const loans = await repo.listByProductId(productId);

			expect(loans.length).toBeGreaterThanOrEqual(2);
			expect(loans.some((l) => l.id === loan1.id)).toBe(true);
			expect(loans.some((l) => l.id === loan2.id)).toBe(true);
		});

		it('should list pending approval loans', async () => {
			const loan: Loan = {
				id: `loan-${Date.now()}-9`,
				productId: 'prod-123',
				userId: 'user-456',
				status: LoanStatus.PendingApproval,
				loanDate: new Date('2025-01-01'),
				dueDate: new Date('2025-12-31'),
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			await repo.create(loan);

			const loans = await repo.listPendingApproval();

			expect(loans.length).toBeGreaterThanOrEqual(1);
			expect(
				loans.some((l) => l.id === loan.id && l.status === LoanStatus.PendingApproval)
			).toBe(true);
		});
	}
);

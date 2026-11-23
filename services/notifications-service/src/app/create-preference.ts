import { randomUUID } from 'crypto';
import { NotificationPreference, NotificationRepo } from '../domain/notification';

export interface CreatePreferenceInput {
	userId: string;
	productId: string;
	notificationTypes: string[];
}

export interface CreatePreferenceOutput {
	preference: NotificationPreference;
}

export async function createPreference(
	input: CreatePreferenceInput,
	repo: NotificationRepo
): Promise<CreatePreferenceOutput> {
	const preference: NotificationPreference = {
		id: randomUUID(),
		userId: input.userId,
		productId: input.productId,
		notificationTypes: input.notificationTypes as any[],
		createdAt: new Date(),
	};

	const saved = await repo.savePreference(preference);

	return { preference: saved };
}

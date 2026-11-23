import { NotificationRepo } from '../domain/notification';

export interface DeletePreferenceInput {
	userId: string;
	productId: string;
}

export async function deletePreference(
	input: DeletePreferenceInput,
	repo: NotificationRepo
): Promise<void> {
	await repo.deletePreference(input.userId, input.productId);
}

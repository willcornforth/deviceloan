import { NotificationPreference, NotificationRepo } from '../domain/notification';

export interface GetPreferencesInput {
	userId: string;
}

export interface GetPreferencesOutput {
	preferences: NotificationPreference[];
}

export async function getPreferences(
	input: GetPreferencesInput,
	repo: NotificationRepo
): Promise<GetPreferencesOutput> {
	const preferences = await repo.getPreferencesByUser(input.userId);
	return { preferences };
}

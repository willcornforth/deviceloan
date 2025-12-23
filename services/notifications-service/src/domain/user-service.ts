export interface UserInfo {
	userId: string;
	email: string;
	name?: string;
}

export interface UserService {
	getUserInfo(userId: string): Promise<UserInfo>;
}

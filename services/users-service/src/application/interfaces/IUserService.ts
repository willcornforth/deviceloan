import { CreateUserRequest } from '../dtos/CreateUserRequest';
import { UpdateUserRequest } from '../dtos/UpdateUserRequest';
import { UserResponse } from '../dtos/UserResponse';

export interface IUserService {
  getById(id: string): Promise<UserResponse | null>;
  getByEmail(email: string): Promise<UserResponse | null>;
  getAll(): Promise<UserResponse[]>;
  create(request: CreateUserRequest): Promise<UserResponse>;
  update(id: string, request: UpdateUserRequest): Promise<UserResponse>;
  delete(id: string): Promise<boolean>;
}

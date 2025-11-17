import { v4 as uuidv4 } from 'uuid';
import { IUserService } from '../interfaces/IUserService';
import { IUserRepository } from '../../domain/interfaces/IUserRepository';
import { CreateUserRequest } from '../dtos/CreateUserRequest';
import { UpdateUserRequest } from '../dtos/UpdateUserRequest';
import { UserResponse } from '../dtos/UserResponse';
import { User } from '../../domain/entities/User';

export class UserService implements IUserService {
  constructor(private readonly userRepository: IUserRepository) {}

  async getById(id: string): Promise<UserResponse | null> {
    const user = await this.userRepository.getById(id);
    return user ? this.mapToResponse(user) : null;
  }

  async getByEmail(email: string): Promise<UserResponse | null> {
    const user = await this.userRepository.getByEmail(email);
    return user ? this.mapToResponse(user) : null;
  }

  async getAll(): Promise<UserResponse[]> {
    const users = await this.userRepository.getAll();
    return users.map(user => this.mapToResponse(user));
  }

  async create(request: CreateUserRequest): Promise<UserResponse> {
    const user: User = {
      id: uuidv4(),
      email: request.email,
      firstName: request.firstName,
      lastName: request.lastName,
      auth0UserId: request.auth0UserId,
      createdAt: new Date(),
      isActive: true
    };

    const createdUser = await this.userRepository.create(user);
    return this.mapToResponse(createdUser);
  }

  async update(id: string, request: UpdateUserRequest): Promise<UserResponse> {
    const existingUser = await this.userRepository.getById(id);
    if (!existingUser) {
      throw new Error(`User with id ${id} not found`);
    }

    const updatedUser: User = {
      ...existingUser,
      email: request.email,
      firstName: request.firstName,
      lastName: request.lastName,
      isActive: request.isActive,
      updatedAt: new Date()
    };

    const result = await this.userRepository.update(updatedUser);
    return this.mapToResponse(result);
  }

  async delete(id: string): Promise<boolean> {
    return await this.userRepository.delete(id);
  }

  private mapToResponse(user: User): UserResponse {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      auth0UserId: user.auth0UserId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      isActive: user.isActive
    };
  }
}

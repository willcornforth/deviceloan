import { CosmosClient, Container, Database } from '@azure/cosmos';
import { IUserRepository } from '../../domain/interfaces/IUserRepository';
import { User } from '../../domain/entities/User';
import { CosmosDbConfig } from '../config/CosmosDbConfig';

export class CosmosDbUserRepository implements IUserRepository {
  private client: CosmosClient;
  private database: Database;
  private container: Container;

  constructor(private config: CosmosDbConfig) {
    this.client = new CosmosClient(this.config.connectionString);
    this.database = this.client.database(this.config.databaseName);
    this.container = this.database.container(this.config.containerName);
  }

  async getById(id: string): Promise<User | null> {
    try {
      const { resource } = await this.container.item(id, id).read<User>();
      return resource || null;
    } catch (error: any) {
      if (error.code === 404) {
        return null;
      }
      throw error;
    }
  }

  async getByEmail(email: string): Promise<User | null> {
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.email = @email',
      parameters: [{ name: '@email', value: email }]
    };

    const { resources } = await this.container.items.query<User>(querySpec).fetchAll();
    return resources.length > 0 ? resources[0] : null;
  }

  async getAll(): Promise<User[]> {
    const querySpec = {
      query: 'SELECT * FROM c'
    };

    const { resources } = await this.container.items.query<User>(querySpec).fetchAll();
    return resources;
  }

  async create(user: User): Promise<User> {
    const { resource } = await this.container.items.create<User>(user);
    if (!resource) {
      throw new Error('Failed to create user');
    }
    return resource;
  }

  async update(user: User): Promise<User> {
    const { resource } = await this.container.item(user.id, user.id).replace<User>(user);
    if (!resource) {
      throw new Error('Failed to update user');
    }
    return resource;
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.container.item(id, id).delete();
      return true;
    } catch (error: any) {
      if (error.code === 404) {
        return false;
      }
      throw error;
    }
  }
}

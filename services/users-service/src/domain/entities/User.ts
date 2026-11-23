export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  auth0UserId: string;
  createdAt: Date;
  updatedAt?: Date;
  isActive: boolean;
}

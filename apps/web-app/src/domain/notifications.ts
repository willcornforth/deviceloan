export type NotificationType = 
  | 'product-released'
  | 'loan-approved'
  | 'loan-rejected'
  | 'loan-returned';

export interface NotificationPreference {
  id: string;
  userId: string;
  productId: string;
  notificationTypes: NotificationType[];
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  productId?: string;
  type: NotificationType;
  message: string;
  sentAt: string;
  metadata?: Record<string, any>;
}

export interface NotificationHistory {
  notifications: Notification[];
  count: number;
}

export type NotificationType = 
  | 'product-released'
  | 'loan-approved'
  | 'loan-rejected'
  | 'loan-returned';

export type NotificationStatus = 'pending' | 'sent' | 'failed';

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
  type: NotificationType;
  subject: string;
  message: string;
  status: NotificationStatus;
  productId?: string;
  loanId?: string;
  createdAt: Date;
  sentAt?: Date;
  error?: string;
}

export interface NotificationHistory {
  notifications: Notification[];
  count: number;
}

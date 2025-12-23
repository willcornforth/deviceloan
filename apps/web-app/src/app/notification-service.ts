import { 
  NotificationPreference, 
  NotificationHistory, 
  NotificationType 
} from '../domain/notifications';

export interface SubscribeRequest {
  productId: string;
  notificationTypes: NotificationType[];
}

export interface NotificationService {
  subscribe(request: SubscribeRequest): Promise<NotificationPreference>;
  unsubscribe(productId: string): Promise<void>;
  getPreferences(): Promise<NotificationPreference[]>;
  getHistory(limit?: number): Promise<NotificationHistory>;
}

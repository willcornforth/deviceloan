import { 
  NotificationService, 
  SubscribeRequest 
} from '../app/notification-service';
import { 
  NotificationPreference, 
  NotificationHistory 
} from '../domain/notifications';

export class HttpNotificationService implements NotificationService {
  constructor(private readonly token: string) {}

  private getBaseUrl(): string {
    // In development, use relative path to leverage Vite proxy
    const baseUrl = import.meta.env.DEV
      ? '/api'
      : import.meta.env.VITE_API_GATEWAY_BASE_URL;

    if (!baseUrl) {
      throw new Error('Missing API Gateway base URL configuration. Please check your environment variables.');
    }

    return baseUrl;
  }

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`,
    };
  }

  async subscribe(request: SubscribeRequest): Promise<NotificationPreference> {
    const response = await fetch(`${this.getBaseUrl()}/notifications/subscribe`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text().catch(() => response.statusText);
      throw new Error(`Failed to subscribe to notifications: ${error}`);
    }

    const json = await response.json();
    return json.data;
  }

  async unsubscribe(productId: string): Promise<void> {
    const response = await fetch(`${this.getBaseUrl()}/notifications/unsubscribe/${productId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.text().catch(() => response.statusText);
      throw new Error(`Failed to unsubscribe from notifications: ${error}`);
    }
  }

  async getPreferences(): Promise<NotificationPreference[]> {
    const response = await fetch(`${this.getBaseUrl()}/notifications/preferences`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.text().catch(() => response.statusText);
      throw new Error(`Failed to fetch notification preferences: ${error}`);
    }

    const json = await response.json();
    return json.data.preferences || [];
  }

  async getHistory(limit?: number): Promise<NotificationHistory> {
    const url = new URL(`${this.getBaseUrl()}/notifications/history`);
    if (limit) {
      url.searchParams.append('limit', limit.toString());
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.text().catch(() => response.statusText);
      throw new Error(`Failed to fetch notification history: ${error}`);
    }

    const json = await response.json();
    return json.data;
  }
}

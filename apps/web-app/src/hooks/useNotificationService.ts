import { useAuth0 } from '@auth0/auth0-react';
import { NotificationService } from '../app/notification-service';
import { HttpNotificationService } from '../infra/http-notification-service';

export function useNotificationService() {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();

  const getNotificationService = async (): Promise<NotificationService> => {
    if (!isAuthenticated) {
      throw new Error('User must be authenticated to use notification service');
    }

    const token = await getAccessTokenSilently();
    return new HttpNotificationService(token);
  };

  return { getNotificationService };
}

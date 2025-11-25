import { HttpResponseInit } from '@azure/functions';

export class ResponseBuilder {
  static success<T>(data: T, message?: string): HttpResponseInit {
    return {
      status: 200,
      jsonBody: {
        ...(message && { message }),
        data,
      },
    };
  }

  static created<T>(data: T, message?: string): HttpResponseInit {
    return {
      status: 201,
      jsonBody: {
        ...(message && { message }),
        data,
      },
    };
  }

  static unauthorized(message: string = 'Invalid or missing authentication token'): HttpResponseInit {
    return {
      status: 401,
      jsonBody: {
        error: 'Unauthorized',
        message,
      },
    };
  }

  static forbidden(message: string = 'Insufficient permissions'): HttpResponseInit {
    return {
      status: 403,
      jsonBody: {
        error: 'Forbidden',
        message,
      },
    };
  }

  static badRequest(message: string = 'Invalid request'): HttpResponseInit {
    return {
      status: 400,
      jsonBody: {
        error: 'Bad Request',
        message,
      },
    };
  }

  static internalError(message: string = 'An internal error occurred'): HttpResponseInit {
    return {
      status: 500,
      jsonBody: {
        error: 'Internal Server Error',
        message,
      },
    };
  }

  static serviceError(statusCode: number, message: string): HttpResponseInit {
    return {
      status: statusCode,
      jsonBody: {
        error: 'Service Error',
        message,
      },
    };
  }

  static badGateway(message: string = 'Unable to connect to upstream service'): HttpResponseInit {
    return {
      status: 502,
      jsonBody: {
        error: 'Bad Gateway',
        message,
      },
    };
  }
}

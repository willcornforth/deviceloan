export class ResponseBuilder {
	static success(data: any, statusCode: number = 200) {
		return {
			status: statusCode,
			jsonBody: data,
		};
	}

	static error(message: string, statusCode: number = 500) {
		return {
			status: statusCode,
			jsonBody: { error: message },
		};
	}

	static notFound(message: string = 'Resource not found') {
		return ResponseBuilder.error(message, 404);
	}

	static badRequest(message: string = 'Bad request') {
		return ResponseBuilder.error(message, 400);
	}

	static unauthorized(message: string = 'Unauthorized') {
		return ResponseBuilder.error(message, 401);
	}

	static forbidden(message: string = 'Forbidden') {
		return ResponseBuilder.error(message, 403);
	}
}

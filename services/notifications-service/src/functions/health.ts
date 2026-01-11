import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";

export async function health(
  _request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("Health check requested");

  return {
    status: 200,
    jsonBody: {
      status: "healthy",
      service: "deviceloan-notifications-service",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    },
  };
}

app.http("health", {
  methods: ["GET"],
  route: "health",
  authLevel: "anonymous",
  handler: health,
});

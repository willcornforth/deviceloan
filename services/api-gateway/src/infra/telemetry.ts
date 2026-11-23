import * as appInsights from "applicationinsights";

let initialized = false;

export function getTelemetryClient(): appInsights.TelemetryClient | undefined {
  try {
    if (!initialized) {
      const conn = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING || process.env.APPINSIGHTS_INSTRUMENTATIONKEY;
      if (conn) {
        // Prefer connection string; fall back to instrumentation key
        if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
          appInsights.setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING);
        } else if (process.env.APPINSIGHTS_INSTRUMENTATIONKEY) {
          appInsights.setup(process.env.APPINSIGHTS_INSTRUMENTATIONKEY);
        }
        // Start SDK; Functions runtime may already collect core telemetry
        appInsights.start();
      }
      initialized = true;
    }
    return appInsights.defaultClient;
  } catch {
    return undefined;
  }
}

export function trackHttpDependency(opts: {
  name: string;
  url: string;
  method: string;
  durationMs: number;
  resultCode?: number | string;
  success: boolean;
  properties?: Record<string, string>;
}) {
  const client = getTelemetryClient();
  if (!client) return;
  client.trackDependency({
    dependencyTypeName: "HTTP",
    name: `${opts.method} ${opts.name}`,
    data: opts.url,
    duration: opts.durationMs,
    resultCode: opts.resultCode?.toString(),
    success: opts.success,
    properties: opts.properties,
  });
}

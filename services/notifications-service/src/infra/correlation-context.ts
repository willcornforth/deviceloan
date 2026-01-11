import { InvocationContext } from "@azure/functions";

/**
 * Extracts and manages correlation context for distributed tracing
 * Integrates with Azure Application Insights
 */
export class CorrelationContext {
  readonly correlationId: string;
  readonly invocationId: string;
  readonly traceParent?: string;

  constructor(
    correlationId: string,
    invocationId: string,
    traceParent?: string
  ) {
    this.correlationId = correlationId;
    this.invocationId = invocationId;
    this.traceParent = traceParent;
  }

  /**
   * Extract correlation context from Azure Functions context
   * Tries to use existing correlation ID from headers or creates a new one
   */
  static fromContext(context: InvocationContext, headers?: Record<string, string | string[]>): CorrelationContext {
    // Try to get correlation ID from request headers first
    let correlationId: string | undefined;
    
    if (headers) {
      const corrIdHeader = headers["x-correlation-id"];
      if (corrIdHeader) {
        correlationId = Array.isArray(corrIdHeader) ? corrIdHeader[0] : corrIdHeader;
      }
    }

    // Fall back to invocation ID if no correlation ID provided
    if (!correlationId) {
      correlationId = context.invocationId;
    }

    return new CorrelationContext(
      correlationId,
      context.invocationId,
      context.traceContext?.traceParent
    );
  }

  /**
   * Get headers object with correlation context for downstream service calls
   */
  getHeaders(): Record<string, string> {
    return {
      "x-correlation-id": this.correlationId,
      "x-invocation-id": this.invocationId,
      ...(this.traceParent && { "traceparent": this.traceParent }),
    };
  }

  /**
   * Get correlation metadata to include in events
   */
  getMetadata() {
    return {
      correlationId: this.correlationId,
      invocationId: this.invocationId,
      traceParent: this.traceParent,
    };
  }

  /**
   * Log prefix for structured logging
   */
  getLogPrefix(): string {
    return `[${this.correlationId.substring(0, 8)}]`;
  }
}

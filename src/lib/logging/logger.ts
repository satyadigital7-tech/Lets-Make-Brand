import { logAuditEvent } from "@/lib/security/audit";

export type LogLevel = "debug" | "info" | "warn" | "error" | "critical";
export type LogCategory =
  | "auth"
  | "security"
  | "rbac"
  | "financial"
  | "kyc"
  | "support"
  | "system"
  | "database";

export interface LogPayload {
  message: string;
  category: LogCategory;
  level?: LogLevel;
  userId?: string | null;
  entityType?: string;
  entityId?: string | null;
  metadata?: Record<string, any>;
  error?: Error | unknown;
}

/**
 * Fields that must NEVER be logged or leaked into log streams.
 */
const SENSITIVE_FIELD_PATTERNS = [
  /password/i,
  /token/i,
  /secret/i,
  /apiKey/i,
  /api_key/i,
  /service_role/i,
  /pan/i,
  /accountNumber/i,
  /account_number/i,
  /cvv/i,
  /pin/i,
  /authorization/i,
  /cookie/i,
];

/**
 * Recursively redacts sensitive keys from log metadata.
 */
export function sanitizeLogData(data: any): any {
  if (!data || typeof data !== "object") {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeLogData(item));
  }

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    const isSensitive = SENSITIVE_FIELD_PATTERNS.some((pattern) =>
      pattern.test(key)
    );

    if (isSensitive) {
      sanitized[key] = "[REDACTED]";
    } else if (value && typeof value === "object") {
      sanitized[key] = sanitizeLogData(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

class Logger {
  private formatLog(payload: LogPayload, level: LogLevel) {
    const timestamp = new Date().toISOString();
    const sanitizedMeta = payload.metadata ? sanitizeLogData(payload.metadata) : {};

    let errObj = undefined;
    if (payload.error instanceof Error) {
      errObj = {
        name: payload.error.name,
        message: payload.error.message,
        stack: payload.error.stack,
      };
    } else if (payload.error) {
      errObj = { message: String(payload.error) };
    }

    return {
      timestamp,
      level,
      category: payload.category,
      message: payload.message,
      userId: payload.userId || null,
      entityType: payload.entityType || null,
      entityId: payload.entityId || null,
      metadata: sanitizedMeta,
      error: errObj,
    };
  }

  info(payload: LogPayload) {
    const formatted = this.formatLog(payload, "info");
    console.log(`[INFO][${payload.category.toUpperCase()}] ${payload.message}`, formatted.metadata);
  }

  warn(payload: LogPayload) {
    const formatted = this.formatLog(payload, "warn");
    console.warn(`[WARN][${payload.category.toUpperCase()}] ${payload.message}`, formatted.metadata);
  }

  error(payload: LogPayload) {
    const formatted = this.formatLog(payload, "error");
    console.error(`[ERROR][${payload.category.toUpperCase()}] ${payload.message}`, formatted.metadata, formatted.error);

    // Persist error audit event if significant
    if (payload.entityType || payload.userId) {
      logAuditEvent({
        userId: payload.userId,
        action: `ERROR_${payload.category.toUpperCase()}`,
        entityType: payload.entityType || "SYSTEM",
        entityId: payload.entityId,
        details: { message: payload.message, ...formatted.metadata },
      }).catch(() => {});
    }
  }

  critical(payload: LogPayload) {
    const formatted = this.formatLog(payload, "critical");
    console.error(`🚨 [CRITICAL ALERT][${payload.category.toUpperCase()}] ${payload.message}`, formatted);

    // Always log critical security / financial events to immutable audit_logs
    logAuditEvent({
      userId: payload.userId,
      action: `CRITICAL_SECURITY_ALERT`,
      entityType: payload.entityType || "SECURITY",
      entityId: payload.entityId,
      details: {
        severity: "CRITICAL",
        category: payload.category,
        message: payload.message,
        ...formatted.metadata,
      },
    }).catch(() => {});
  }

  securityIncident(
    action: string,
    message: string,
    userId?: string | null,
    metadata?: Record<string, any>
  ) {
    this.critical({
      message: `Security incident detected: ${message}`,
      category: "security",
      level: "critical",
      userId,
      entityType: "SECURITY_INCIDENT",
      metadata: { action, ...metadata },
    });
  }

  financialAudit(
    action: string,
    message: string,
    userId: string,
    amount: number,
    metadata?: Record<string, any>
  ) {
    this.info({
      message: `Financial operation: ${message} (Amount: ₹${amount})`,
      category: "financial",
      level: "info",
      userId,
      entityType: "WALLET_LEDGER",
      metadata: { action, amount, ...metadata },
    });
  }
}

export const logger = new Logger();


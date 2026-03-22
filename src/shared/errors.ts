export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class TenantNotFoundError extends AppError {
  constructor(channelId: string) {
    super(`Tenant not found for channel: ${channelId}`, 404);
    this.name = "TenantNotFoundError";
  }
}

export class SignatureVerificationError extends AppError {
  constructor() {
    super("Invalid LINE signature", 401);
    this.name = "SignatureVerificationError";
  }
}

export class PluginNotEnabledError extends AppError {
  constructor(pluginName: string, orgId: string) {
    super(`Plugin "${pluginName}" is not enabled for org "${orgId}"`, 403);
    this.name = "PluginNotEnabledError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 403);
    this.name = "UnauthorizedError";
  }
}

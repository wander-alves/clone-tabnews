class InternalServerError extends Error {
  constructor({ cause, statusCode }) {
    super("Ocorreu um erro interno inesperado.", {
      cause,
    });
    this.name = "InternalServerError";
    this.action = "Entre em contato com o suporte.";
    this.statusCode = statusCode || 500;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}

class ServiceError extends Error {
  constructor({ cause, message }) {
    super(message || "Serviço indisponível no momento.", {
      cause,
    });
    this.name = "ServiceError";
    this.action = "Verifique a disponibilidade do serviço.";
    this.statusCode = 503;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}

class MethodNotAllowedError extends Error {
  constructor() {
    super("O método utilizado não é suportado pelo endpoint.");
    this.name = "MethodNotAllowedError";
    this.action = "Verifique se o método HTTP é permitido para o endpoint.";
    this.statusCode = 405;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}

export { InternalServerError, MethodNotAllowedError, ServiceError };

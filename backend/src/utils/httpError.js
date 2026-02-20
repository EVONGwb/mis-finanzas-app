export class HttpError extends Error {
  constructor(status = 500, message = "Error interno", details = null) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

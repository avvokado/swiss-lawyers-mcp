export class DirectoryError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "INVALID_INPUT"
      | "NOT_FOUND"
      | "EMPTY_DATASET"
      | "INTERNAL_ERROR",
  ) {
    super(message);
    this.name = "DirectoryError";
  }
}

export class NotFoundError extends DirectoryError {
  constructor(message: string) {
    super(message, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class InvalidInputError extends DirectoryError {
  constructor(message: string) {
    super(message, "INVALID_INPUT");
    this.name = "InvalidInputError";
  }
}

export class EmptyDatasetError extends DirectoryError {
  constructor(message: string) {
    super(message, "EMPTY_DATASET");
    this.name = "EmptyDatasetError";
  }
}

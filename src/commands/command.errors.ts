export class GittCommandError extends Error {}

export class GittAlreadyInitializedError extends GittCommandError {
  constructor() {
    super('Gitt already initialized');
  }
}

export class GittNotInitializedError extends GittCommandError {
  constructor() {
    super('Gitt not initialized!');
  }
}

export class NotFoundGitRepositoriesError extends GittCommandError {
  constructor() {
    super('There is no Git repository in this folder.');
  }
}

import { Stats } from 'node:fs';
import { lstat, readdir } from 'node:fs/promises';
import { basename, join } from 'node:path';
import {
  createTables,
  repositoriesTableName,
} from '../../migrations/create-tables.sql';
import { Repository } from '../../repository/repository';
import { AcceptPromise } from '../../utils/utils';
import {
  CommandBase,
  IExecutionResult,
  TRollbackExecutionResponse,
} from '../command-base';
import { GittAlreadyInitializedError } from '../command.errors';

class NotFoundGitRepositoriesError extends Error {
  constructor() {
    super('There is no Git repository in this folder.');
  }
}

/**
 * Command to start Gitt Management
 *
 * Should be executed on parent folder
 */
export class GittStartCommand extends CommandBase {
  public name = 'start';
  public description =
    'Command to start Gitt Management. Should be executed on parent folder';
  needStart = false;

  async prepareExecution(): Promise<void> {
    const alreadyInitialzied: boolean = await Repository.alreadyInitialized();

    if (alreadyInitialzied) {
      throw new GittAlreadyInitializedError();
    }

    const allDirectoriesOfCurrentPath =
      await this.getAllDirectoriesOfCurrentPath();

    const directoriesGitRepositoriesStats: [string, boolean][] =
      await Promise.all(
        allDirectoriesOfCurrentPath.map(async dirPath => [
          dirPath,
          await this.checkIfIsGitRepository(dirPath),
        ])
      );

    const allGitRepositories = directoriesGitRepositoriesStats
      .filter(([, isGitRepository]) => isGitRepository)
      .map(([name]) => name);

    if (!allGitRepositories.length) {
      throw new NotFoundGitRepositoriesError();
    }

    await this.createRepositoriesTables();
    await this.createRepositoriesRows(allGitRepositories);

    return;
  }

  execute(): IExecutionResult {
    return { result: undefined as unknown as any, message: '' };
  }

  private async getAllDirectoriesOfCurrentPath(): Promise<string[]> {
    const rootDirPath = process.cwd();

    const dirList = await readdir(rootDirPath, {
      withFileTypes: false,
    });

    const itemsStats: [string, Stats][] = await Promise.all(
      dirList.map(async itemName => {
        const itemPath = join(rootDirPath, itemName);
        const stat = await lstat(itemPath);
        return [itemPath, stat];
      })
    );

    const allDirectories = itemsStats.filter(([, stats]) =>
      stats.isDirectory()
    );

    return allDirectories.map(([name]) => name);
  }

  async checkIfIsGitRepository(path: string): Promise<boolean> {
    const dirList = await readdir(path);

    return dirList.some(itemName => itemName === '.git');
  }

  private async createRepositoriesTables(): Promise<void> {
    await createTables();
  }

  private async createRepositoriesRows(
    gitRepositoriesPaths: string[]
  ): Promise<void> {
    await Promise.all(
      gitRepositoriesPaths.map(async path => {
        const name = basename(path);

        await this.repository.run(`
          INSERT INTO ${repositoriesTableName} (name, path) VALUES ('${name}', '${path}'');`);
      })
    );

    return;
  }

  rollback(): AcceptPromise<TRollbackExecutionResponse> {
    throw new Error('Method not implemented.');
  }

  helper(): AcceptPromise<void> {
    throw new Error('Method not implemented.');
  }
}

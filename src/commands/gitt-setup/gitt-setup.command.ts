import chalk from 'chalk';
import inquirer from 'inquirer';
import { Stats } from 'node:fs';
import { lstat, readdir } from 'node:fs/promises';
import { basename, join } from 'node:path';
import {
  createTables,
  repositoriesTableName,
} from '../../migrations/create-tables.sql';
import { Repository } from '../../repository/repository';
import { IRepositoryModel } from '../../repository/repository.model';
import { AcceptPromise } from '../../utils/utils';
import { CommandBase, TRollbackExecutionResponse } from '../command-base';
import { GittNotInitializedError } from '../command.errors';

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
export class GittSetupCommand extends CommandBase {
  public name = 'setup';
  public description =
    'Command to config Gitt Management. Should be executed on parent folder';
  needStart = false;

  init(): void {
    const removeCommand = this.command.command('remove', {});
    const addCommand = this.command.command('add', {});

    removeCommand.action(() => this.removeCommand());
    addCommand.action(() => this.addCommand());
  }

  private async addCommand(): Promise<void> {
    const alreadyInitialzied: boolean = await Repository.alreadyInitialized();

    if (!alreadyInitialzied) {
      throw new GittNotInitializedError();
    }

    const allGitRepositoriesForCurrentFolder = await this.getGitReposPaths();
    const registeredRepos = await this.repository.getAllRepositories();
    const notRegisteredRepos = allGitRepositoriesForCurrentFolder.filter(
      repo => {
        return !registeredRepos.some(repo2 => repo === repo2.path);
      }
    );

    if (!notRegisteredRepos.length) {
      console.log('No new repo found');
      return;
    }

    await this.askToAddRepos(notRegisteredRepos);
  }

  private async removeCommand(): Promise<void> {
    const alreadyInitialzied: boolean = await Repository.alreadyInitialized();

    if (!alreadyInitialzied) {
      throw new GittNotInitializedError();
    }

    const registeredRepos = await this.repository.getAllRepositories();

    await this.askRemoveRepos('Select repos to remove', registeredRepos);
  }

  async prepareExecution(): Promise<void> {
    const alreadyInitialzied: boolean = await Repository.alreadyInitialized();

    const allGitRepositoriesForCurrentFolder = await this.getGitReposPaths();

    if (!allGitRepositoriesForCurrentFolder.length) {
      throw new NotFoundGitRepositoriesError();
    }

    if (!alreadyInitialzied) {
      await this.createRepositoriesTables();
    }

    const registeredRepos = await this.repository.getAllRepositories();

    const notRegisteredRepos = allGitRepositoriesForCurrentFolder.filter(
      repo => {
        return !registeredRepos.some(repo2 => repo === repo2.path);
      }
    );

    console.log(
      `Current repos:\n${registeredRepos
        .map(r => `  ${chalk.bold(r.name)} (${r.path})\n`)
        .join('')}`
    );

    if (notRegisteredRepos.length) {
      await this.askToAddRepos(notRegisteredRepos);
    } else {
      return;
    }

    console.log('\nDone');

    return;
  }

  private async getGitReposPaths(): Promise<string[]> {
    const allDirectoriesOfCurrentPath =
      await this.getAllDirectoriesOfCurrentPath();

    const directoriesStats: [string, boolean][] = await Promise.all(
      allDirectoriesOfCurrentPath.map(async dirPath => [
        dirPath,
        await this.checkIfIsGitRepository(dirPath),
      ])
    );

    const allGitRepositoriesForCurrentFolder = directoriesStats
      .filter(([, isGitRepository]) => isGitRepository)
      .map(([name]) => name);

    return allGitRepositoriesForCurrentFolder;
  }

  private async askToAddRepos(repoPaths: string[]): Promise<void> {
    const selectionPrompt = await inquirer.prompt({
      type: 'checkbox',
      name: 'askAddRepo',
      message: `Select to ${chalk.greenBright('add')}.`,
      choices: repoPaths.map(repoPath => {
        return {
          name: ` ${chalk.bold(basename(repoPath))}`,
          value: repoPath,
        };
      }),
    });

    await this.createRepositoriesRows(selectionPrompt.askAddRepo as string[]);
  }

  private async askRemoveRepos(
    message: string,
    registeredRepos: IRepositoryModel[]
  ) {
    console.log(
      `${chalk.bgYellowBright.black(
        "This don't remove the repo directory, just from the Gitt list."
      )}`
    );

    const selectionPrompt = await inquirer.prompt({
      type: 'checkbox',
      name: 'askRemoveCurrentRepo',
      message,
      choices: registeredRepos.map(repo => {
        return {
          name: ` ${chalk.bold(repo.name)}`,
          value: repo,
        };
      }),
    });

    const askRemoveCurrentRepo =
      selectionPrompt.askRemoveCurrentRepo as IRepositoryModel[];

    const surePrompt = await inquirer.prompt({
      type: 'confirm',
      name: 'sureToRemove',
      message: `Are you sure you want to remove: ${askRemoveCurrentRepo
        .map(r => chalk.bold.redBright(r.name))
        .join(', ')}?`,
    });

    if (surePrompt?.sureToRemove) {
      await this.repository.removeRepos(askRemoveCurrentRepo);
    }
  }

  execute = undefined as unknown as any;

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
          INSERT INTO ${repositoriesTableName} (name, path) VALUES ('${name}', '${path}');`);
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

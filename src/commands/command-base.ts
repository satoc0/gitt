/* eslint-disable @typescript-eslint/ban-types */
import chalk from 'chalk';
import { Command } from 'commander';
import inquirer from 'inquirer';
import { TRuntimeRepoEntry } from '../generic.model';
import { Repository } from '../repository/repository';
import { IRepositoryModel } from '../repository/repository.model';
import { Runtime } from '../runtime';
import { AcceptPromise } from '../utils/utils';
import { GittNotInitializedError } from './command.errors';
import { Result } from './result';
import { spinnies } from './spinner';

type TReposActionFn = (
  entry: TRuntimeRepoEntry
) => AcceptPromise<IExecutionResult>;

export type TCommandArguments = [object, Command];
export type TArguments = Record<string, unknown>;

export interface IExecutionResult {
  result: Result;
  message: string;
  rollbackMessage?: string;
}

export type TRollbackExecutionResponse = Pick<
  IExecutionResult,
  'message' | 'result'
>;

interface IInternalExecutionResult extends IExecutionResult {
  entry: TRuntimeRepoEntry;
  success: boolean;
}

export abstract class CommandBase {
  abstract name: string;
  abstract description: string;
  public needStart = true;

  protected command!: Command;

  constructor(public readonly runtime: Runtime) {}

  /**
   * Method called after command factory,
   * used to customize command.
   */
  public init(): void {}

  public factory(): Command {
    this.command = new Command() as Command;

    this.command.name(this.name);
    this.command.description(this.description);
    this.command.action((args, command) => this.commandRunner(args, command));

    this.init();
    return this.command;
  }

  private async commandRunner(args: TArguments, command: Command) {
    try {
      if (this.needStart && !this.runtime.isAlreadyInitialized) {
        throw new GittNotInitializedError();
      }
      await this.prepareExecution(args, command);

      const executionResult = this.execute
        ? await this.runOnAllRepos(entry =>
            this.execute?.(entry, args, command)
          )
        : [];

      const repoWithError = executionResult.filter(result => !result.success);
      const allFail = executionResult.every(result => !result.success);
      const hasSomeError = !!repoWithError.length;

      if (hasSomeError && !allFail) {
        const messageTitle = `\n${chalk.bold('Fail: ')}\n\n`;
        const message: string = executionResult.reduce(
          (finalMessage, execResult) => {
            const repoName = chalk.bold(execResult.entry.repo.name);
            let execMessage = chalk.bgBlack(
              execResult.success
                ? chalk.greenBright(repoName)
                : chalk.redBright(repoName)
            );

            execMessage += '\n';

            execMessage += !execResult.success
              ? 'No rollback needed(command fail)'
              : `Rollback:\n${execResult.rollbackMessage}`;

            execMessage += '\n\n';

            return finalMessage + execMessage;
          },
          messageTitle
        );

        const result = await inquirer.prompt({
          name: 'rollbackQuestion',
          type: 'confirm',
          message: message + 'Execute rollbacks?',
        });

        if (result.rollbackQuestion) {
          await this.runOnAllRepos(entry =>
            this.rollback?.(entry, args, command)
          );
        }
      }
    } catch (e) {
      console.log(e);
    }
  }

  get repository(): Repository {
    return Repository.getInstance();
  }

  get repos(): IRepositoryModel[] {
    return this.runtime.allRepositories;
  }

  /**
   * Executed before running the main action command on all repositories.
   * @param args
   */
  abstract prepareExecution(
    args: TArguments,
    command: Command
  ): AcceptPromise<void>;
  /**
   * Executed for each repository.
   * @param entry TRuntimeRepoEntry
   * @param args object
   * @param command Command
   */
  abstract execute(
    entry: TRuntimeRepoEntry,
    args: TArguments,
    command: Command
  ): AcceptPromise<IExecutionResult>;

  private async runOnAllRepos(
    fn: TReposActionFn
  ): Promise<IInternalExecutionResult[]> {
    const executionResults: IInternalExecutionResult[] = await Promise.all(
      this.runtime.allRepos.map(async entry => {
        spinnies.add(entry.repo.name);

        const executionResult = await fn(entry);

        const { result, message, rollbackMessage } = executionResult;
        const success = result.isOk();

        return {
          result,
          entry,
          success,
          message,
          rollbackMessage,
        };
      })
    );

    executionResults.forEach(executionResult => {
      const repoName = executionResult.entry.repo.name;
      const message = executionResult.message?.replace?.(/\n$/, '') || '';
      const nameTitle = executionResult.success
        ? chalk.greenBright(repoName)
        : chalk.redBright(repoName);
      const text = `${nameTitle}: ${message}`;

      if (executionResult.success) {
        spinnies.succeed(repoName, text);
      } else {
        spinnies.fail(repoName, text);
      }
    });

    return executionResults;
  }

  abstract helper(): AcceptPromise<void>;

  abstract rollback(
    entry: TRuntimeRepoEntry,
    args: TArguments,
    command: Command
  ): AcceptPromise<TRollbackExecutionResponse>;
}

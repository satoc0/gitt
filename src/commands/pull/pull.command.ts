import { Command } from 'commander';
import { TRuntimeRepoEntry } from '../../generic.model';
import {
  CommandBase,
  IExecutionResult,
  TArguments,
  TRollbackExecutionResponse,
} from '../command-base';
import { Result } from '../result';
import chalk from 'chalk';

interface LastExecutionState {
  previousHeadOfEachBranch: Record<string, string>;
}

export class PullCommand extends CommandBase {
  name = 'pull';
  description = 'Execute a pull on each repo';

  state: LastExecutionState = {
    previousHeadOfEachBranch: {},
  };

  init(): void {
    this.command.allowUnknownOption();
  }

  prepareExecution(): void {}

  async execute(
    entry: TRuntimeRepoEntry,
    _args: TArguments,
    command: Command
  ): Promise<IExecutionResult> {
    const argsArr: string[] = command.args;
    const currentHeadOfBranch = await entry.sg.raw('rev-parse', 'HEAD');

    this.state.previousHeadOfEachBranch[entry.repo.name] = currentHeadOfBranch;

    const result = await Result.run(() => entry.sg.raw(['pull', ...argsArr]));

    // todo: check if has changes and add to stash before git checkout to commit
    // after git checkout restore from stash
    // rollback message will change

    return {
      result,
      message: result.isOk()
        ? result.getResultValue()
        : result.getResultValue().message,
      rollbackMessage: `  Checkout to last commit hash before pull.\n  ${chalk.bgBlackBright(
        ` $ git checkout ${currentHeadOfBranch}`
      )}`,
    };
  }

  async rollback(
    entry: TRuntimeRepoEntry
  ): Promise<TRollbackExecutionResponse> {
    const lastCommitHash: string =
      this.state.previousHeadOfEachBranch[entry.repo.name];

    const result = await Result.run(() =>
      entry.sg.raw(['checkout', lastCommitHash])
    );

    return {
      result,
      message: result.isOk() ? 'Ok' : result.getResultValue()?.message,
    };
  }

  helper(): Promise<void> {
    throw new Error('Method not implemented.');
  }
}

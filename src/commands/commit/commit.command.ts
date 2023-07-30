import { Command } from 'commander';
import { TRuntimeRepoEntry } from '../../generic.model';
import { AcceptPromise } from '../../utils/utils';
import {
  CommandBase,
  IExecutionResult,
  TArguments,
  TRollbackExecutionResponse,
} from '../command-base';
import { Result } from '../result';

export class CommitCommand extends CommandBase {
  name = 'commit';
  description = 'Execute commit command for each repository';

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

    const result = await Result.run(() => entry.sg.raw(['commit', ...argsArr]));

    return { result, message: result.getResultValue() };
  }

  rollback(): AcceptPromise<TRollbackExecutionResponse> {
    throw new Error('Method not implemented.');
  }

  helper(): AcceptPromise<void> {
    throw new Error('Method not implemented.');
  }
}

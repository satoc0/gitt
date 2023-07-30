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

export class PushCommand extends CommandBase {
  name = 'push';
  description = 'Execute a push on all repositories';

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

    const result = await Result.run(() => entry.sg.raw(['push', ...argsArr]));

    return { result, message: result.getResultValue() };
  }

  rollback(): AcceptPromise<TRollbackExecutionResponse> {
    throw new Error('Method not implemented.');
  }

  helper(): Promise<void> {
    throw new Error('Method not implemented.');
  }
}

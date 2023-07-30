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

export class CheckoutCommand extends CommandBase {
  name = 'checkout';
  description = 'Execute checkout command for each repository';

  init(): void {
    this.command.allowUnknownOption();
  }

  private rollbackBranch!: string;

  prepareExecution(): void {}

  async execute(
    entry: TRuntimeRepoEntry,
    _args: TArguments,
    command: Command
  ): Promise<IExecutionResult> {
    this.rollbackBranch = (await entry.sg.status()).current as string;
    const argsArr: string[] = command.args;

    const result = await Result.run(() =>
      entry.sg.raw(['checkout', ...argsArr])
    );

    return { result, message: result.getResultValue() };
  }

  async rollback(
    entry: TRuntimeRepoEntry
  ): Promise<TRollbackExecutionResponse> {
    const result = await Result.run(() =>
      entry.sg.raw(['checkout', this.rollbackBranch])
    );

    return { result, message: result.getResultValue() };
  }

  helper(): AcceptPromise<void> {
    throw new Error('Method not implemented.');
  }
}

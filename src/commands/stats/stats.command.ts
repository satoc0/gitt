import { TRuntimeRepoEntry } from '../../generic.model';
import { AcceptPromise } from '../../utils/utils';
import {
  CommandBase,
  IExecutionResult,
  TRollbackExecutionResponse,
} from '../command-base';
import { Result } from '../result';

export class StatsCommand extends CommandBase {
  name = 'stats';
  description = 'Get info of all repositories';

  prepareExecution(args: unknown): void {
    console.log('stats', { args });
  }

  async execute(entry: TRuntimeRepoEntry): Promise<IExecutionResult> {
    const result = await Result.run(() => entry.sg.status());

    return {
      result,
      message: `Current branch: ${result.getResultValue().current}`,
    };
  }

  helper(): AcceptPromise<void> {
    throw new Error('Method not implemented.');
  }

  rollback(): AcceptPromise<TRollbackExecutionResponse> {
    throw new Error('Method not implemented.');
  }
}

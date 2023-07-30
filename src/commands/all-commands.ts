import { CheckoutCommand } from './checkout/checkout.command';
import { CommitCommand } from './commit/commit.command';
import { GittSetupCommand } from './gitt-setup/gitt-setup.command';
import { MergeCommand } from './merge/merge.command';
import { PullCommand } from './pull/pull.command';
import { PushCommand } from './push/push.command';
import { StatsCommand } from './stats/stats.command';

export const allCommands = [
  GittSetupCommand,
  CommitCommand,
  PullCommand,
  PushCommand,
  MergeCommand,
  StatsCommand,
  CheckoutCommand,
];

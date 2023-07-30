import { Command } from 'commander';
import { allCommands } from './commands/all-commands';
import { Runtime } from './runtime';

const packageJson = require('../package.json');
const name: string = packageJson.name;
const version: string = packageJson.version;
const description: string = packageJson.description;

export const Program = new Command(name)
  .name(name)
  .description(description)
  .version(version);

async function init(): Promise<void> {
  const runtime = new Runtime();
  await runtime.init();

  /**
   * Factory all base commands
   */
  allCommands.forEach(Command => {
    const command = new Command(runtime);
    Program.addCommand(command.factory() as Command);
  });

  /**
   * Execute requested command
   */
  Program.parse();
}

void init();

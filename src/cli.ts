#!/usr/bin/env node

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { Command } from 'commander';
import { createWorkspaceCommand } from './commands/workspace';
import { createObjectCommand } from './commands/object';
import { createRecordCommand } from './commands/record';
import { createListCommand } from './commands/list';
import { createEntryCommand } from './commands/entry';
import { createNoteCommand } from './commands/note';
import { createTaskCommand } from './commands/task';
import { createMeetingCommand } from './commands/meeting';
import { createAttributeCommand } from './commands/attribute';
import { createCommentCommand } from './commands/comment';
import { createWebhookCommand } from './commands/webhook';
import { createThreadCommand } from './commands/thread';
import { createSelfCommand } from './commands/self';
import { createEmailCommand } from './commands/email';
import { createSqlCommand } from './commands/sql';
import { applyRootOptions, RootOptions } from './utils/root-options';

const packageJson = JSON.parse(
  readFileSync(resolve(__dirname, '../package.json'), 'utf8')
) as { version: string };

const program = new Command();

program
  .name('attio')
  .description('Fully-typed TypeScript CLI for managing Attio CRM via REST API')
  .version(packageJson.version);

program.option(
  '--api-key <key>',
  'Attio API key (overrides ATTIO_API_KEY env var)'
);
program.option('--debug', 'Show stack traces for errors');

program.hook('preAction', () => {
  applyRootOptions(program.opts<RootOptions>());
});

// Add commands
program.addCommand(createWorkspaceCommand());
program.addCommand(createObjectCommand());
program.addCommand(createRecordCommand());
program.addCommand(createListCommand());
program.addCommand(createEntryCommand());
program.addCommand(createNoteCommand());
program.addCommand(createTaskCommand());
program.addCommand(createMeetingCommand());
program.addCommand(createAttributeCommand());
program.addCommand(createCommentCommand());
program.addCommand(createWebhookCommand());
program.addCommand(createThreadCommand());
program.addCommand(createSelfCommand());
program.addCommand(createEmailCommand());
program.addCommand(createSqlCommand());

program.parse();

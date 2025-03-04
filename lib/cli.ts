import { Command } from 'commander';
import { down } from './commands/down';
import { init } from './commands/init';
import { newCommand } from './commands/new';
import { status } from './commands/status';
import { up } from './commands/up';
import { Config } from './config';

export const cli = (config?: Config): void => {
  const program = new Command();
  if (!config) {
    console.log('No config found. Please run `init` before continuing');
  }

  program
    .command('init')
    .description('Creates the migrations directory and configuration file')
    .action(() => {
      init();
    });
  if (config) {
    program
      .command('new')
      .description('Create a new migration file under migrations directory')
      .storeOptionsAsProperties(false)
      .option('-n, --name <name>', 'the migration name')
      .option('-t, --template-file <path>', 'The template file to use')
      .action((opts) => {
        let name = opts.name;
        let templateFile = opts.templateFile;

        if (typeof opts.name !== 'string' || opts.name.length === 0) {
          name = undefined;
        }

        if (
          typeof opts.templateFile !== 'string' ||
          opts.templateFile.length === 0
        ) {
          templateFile = undefined;
        }

        const { migrationPath, className } = newCommand({
          migrationName: name,
          migrationsDir: config.migrationsDir,
          templateFile: templateFile,
          fileExt: config.fileExt,
        });

        if (config.afterNew) config.afterNew(migrationPath, className, name);
      });

    program
      .command('up')
      .description('Run all pending migrations')
      .action(async () => {
        try {
          await up({ config });
          if (config.afterUp) config.afterUp();
        } catch (e) {
          console.error(e);
          process.exitCode = 1;
        } finally {
          process.exit();
        }
      });

    program
      .command('down')
      .description('Undo migrations')
      .option('-l, --last', 'Undo the last applied migration')
      .option('-a, --all', 'Undo all applied migrations')
      .action((opts) => {
        if (!opts.last && !opts.all) {
          program.outputHelp();
          process.exit(-1);
        }

        down({
          config,
          mode: opts.last ? 'last' : 'all',
        });

        if (config.afterDown) config.afterDown();
      });

    program
      .command('status')
      .description('Show the status of the migrations')
      .action(() => {
        status({ config });
      });
  }

  program.parse();
};

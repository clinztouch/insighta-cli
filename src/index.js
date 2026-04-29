#!/usr/bin/env node

const { program } = require('commander');
const ora = require('ora');
const { login, logout, whoami } = require('./auth');
const { listProfiles, getProfile, searchProfiles, createProfile, exportProfiles } = require('./profiles');

program
  .name('insighta')
  .description('Insighta Labs CLI — Demographic Intelligence Platform')
  .version('1.0.0');

// ─── Auth Commands ───────────────────────────────────────────

program
  .command('login')
  .description('Login via GitHub OAuth')
  .action(async () => {
    try {
      const user = await login();
      console.log(`\n✅ Logged in as @${user.username} (${user.role})\n`);
    } catch (err) {
      console.error(`Login failed: ${err.message}`);
      process.exit(1);
    }
  });

program
  .command('logout')
  .description('Logout and clear credentials')
  .action(async () => {
    await logout();
  });

program
  .command('whoami')
  .description('Show current logged in user')
  .action(async () => {
    await whoami();
  });

// ─── Profiles Commands ───────────────────────────────────────

const profiles = program.command('profiles').description('Manage profiles');

profiles
  .command('list')
  .description('List profiles with optional filters')
  .option('--gender <gender>', 'Filter by gender (male|female)')
  .option('--country <country_id>', 'Filter by country ID (e.g. NG)')
  .option('--age-group <age_group>', 'Filter by age group (child|teenager|adult|senior)')
  .option('--min-age <min_age>', 'Minimum age')
  .option('--max-age <max_age>', 'Maximum age')
  .option('--sort-by <sort_by>', 'Sort by field (age|created_at|gender_probability)')
  .option('--order <order>', 'Sort order (asc|desc)')
  .option('--page <page>', 'Page number', '1')
  .option('--limit <limit>', 'Items per page', '10')
  .action(async (options) => {
    const spinner = ora('Fetching profiles...').start();
    try {
      spinner.stop();
      await listProfiles(options);
    } catch (err) {
      spinner.fail('Failed to fetch profiles');
      process.exit(1);
    }
  });

profiles
  .command('get <id>')
  .description('Get a profile by ID')
  .action(async (id) => {
    const spinner = ora('Fetching profile...').start();
    try {
      spinner.stop();
      await getProfile(id);
    } catch (err) {
      spinner.fail('Failed to fetch profile');
      process.exit(1);
    }
  });

profiles
  .command('search <query>')
  .description('Search profiles using natural language')
  .option('--page <page>', 'Page number', '1')
  .option('--limit <limit>', 'Items per page', '10')
  .action(async (query, options) => {
    const spinner = ora(`Searching for "${query}"...`).start();
    try {
      spinner.stop();
      await searchProfiles(query, options);
    } catch (err) {
      spinner.fail('Search failed');
      process.exit(1);
    }
  });

profiles
  .command('create')
  .description('Create a new profile (admin only)')
  .requiredOption('--name <name>', 'Profile name')
  .action(async (options) => {
    const spinner = ora(`Creating profile for "${options.name}"...`).start();
    try {
      spinner.stop();
      await createProfile(options.name);
    } catch (err) {
      spinner.fail('Failed to create profile');
      process.exit(1);
    }
  });

profiles
  .command('export')
  .description('Export profiles as CSV')
  .requiredOption('--format <format>', 'Export format (csv)')
  .option('--gender <gender>', 'Filter by gender')
  .option('--country <country_id>', 'Filter by country ID')
  .option('--age-group <age_group>', 'Filter by age group')
  .action(async (options) => {
    const spinner = ora('Exporting profiles...').start();
    try {
      spinner.stop();
      await exportProfiles(options);
    } catch (err) {
      spinner.fail('Export failed');
      process.exit(1);
    }
  });

program.parse(process.argv);
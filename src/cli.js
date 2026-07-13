#!/usr/bin/env node

import 'dotenv/config';
import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { RuleEngine } from './rules/rule-engine.js';
import { PPTParser } from './parsers/ppt-parser.js';
import { HtmlGenerator } from './generators/html-generator.js';
import { AgentHarness } from './agent/harness.js';

const program = new Command();

program
  .name('ppt-to-html')
  .description('Convert PowerPoint presentations to HTML using AI-powered transformation')
  .version('1.0.0');

/**
 * Convert command
 */
program
  .command('convert')
  .description('Convert a PPT file to HTML')
  .argument('<input>', 'Input PPT/PPTX file')
  .option('-o, --output <file>', 'Output HTML file', 'output.html')
  .option('-r, --rules <file>', 'Custom rules YAML file')
  .option('--use-agent', 'Use AI agent for intelligent conversion', false)
  .option('--export-data', 'Export parsed PPT data to JSON')
  .option('--verbose', 'Verbose output', false)
  .action(async (input, options) => {
    console.log(chalk.blue.bold('\n=== PPT to HTML Converter ===\n'));

    try {
      // Check input file exists
      await fs.access(input);

      // Initialize rule engine
      console.log(chalk.gray('Loading rules...'));
      const ruleEngine = new RuleEngine();
      await ruleEngine.loadDefaultRules();

      // Load custom rules if specified
      if (options.rules) {
        console.log(chalk.gray(`Loading custom rules from ${options.rules}...`));
        await ruleEngine.loadCustomRules(options.rules);
      }

      // Parse PPT
      console.log(chalk.gray(`Parsing ${input}...`));
      const parser = new PPTParser();
      const pptData = await parser.parse(input);

      // Export parsed data if requested
      if (options.exportData) {
        const dataPath = options.output.replace(/\.html$/, '.json');
        await parser.exportToJson(dataPath);
      }

      // Generate HTML
      console.log(chalk.gray('Generating HTML...'));

      if (options.useAgent) {
        // Use AI agent for conversion
        const agent = new AgentHarness({ verbose: options.verbose });
        await agent.initialize(ruleEngine);
        agent.setPPTData(pptData);

        const result = await agent.run(
          `Convert this PowerPoint presentation to HTML. Output the complete HTML document.`,
          { maxIterations: 5 }
        );

        if (result.success) {
          await fs.writeFile(options.output, result.result, 'utf8');
          console.log(chalk.green(`\n✓ Conversion complete!`));
          console.log(chalk.gray(`  Output: ${options.output}`));
          console.log(chalk.gray(`  Iterations: ${result.iterations}`));
          console.log(chalk.gray(`  Tokens: ${JSON.stringify(result.usage)}`));
        } else {
          console.error(chalk.red(`\n✗ Conversion failed: ${result.error}`));
          process.exit(1);
        }

      } else {
        // Direct conversion without agent
        const generator = new HtmlGenerator(ruleEngine);
        const html = await generator.generate(pptData);
        await generator.saveToFile(html, options.output);

        console.log(chalk.green(`\n✓ Conversion complete!`));
        console.log(chalk.gray(`  Input: ${input}`));
        console.log(chalk.gray(`  Output: ${options.output}`));
        console.log(chalk.gray(`  Slides: ${pptData.totalSlides}`));
      }

    } catch (error) {
      console.error(chalk.red(`\n✗ Error: ${error.message}`));
      if (options.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

/**
 * Validate rules command
 */
program
  .command('validate-rules')
  .description('Validate a rules YAML file')
  .argument('<file>', 'Rules YAML file to validate')
  .action(async (file) => {
    console.log(chalk.blue.bold('\n=== Rule Validator ===\n'));

    try {
      const { RuleValidator } = await import('./rules/validator.js');
      const validator = new RuleValidator();
      const result = await validator.validateFile(file);

      validator.printResults();

      if (!result.valid) {
        process.exit(1);
      }

    } catch (error) {
      console.error(chalk.red(`\n✗ Error: ${error.message}`));
      process.exit(1);
    }
  });

/**
 * Export rules command
 */
program
  .command('export-rules')
  .description('Export merged rules (default + custom) to a file')
  .option('-r, --rules <file>', 'Custom rules to merge')
  .option('-o, --output <file>', 'Output file', 'merged-rules.yaml')
  .action(async (options) => {
    console.log(chalk.blue.bold('\n=== Export Rules ===\n'));

    try {
      const ruleEngine = new RuleEngine();
      await ruleEngine.loadDefaultRules();

      if (options.rules) {
        await ruleEngine.loadCustomRules(options.rules);
      }

      await ruleEngine.exportRules(options.output);

      console.log(chalk.green(`\n✓ Rules exported to ${options.output}`));

    } catch (error) {
      console.error(chalk.red(`\n✗ Error: ${error.message}`));
      process.exit(1);
    }
  });

/**
 * Parse PPT command (for debugging)
 */
program
  .command('parse')
  .description('Parse a PPT file and output JSON data')
  .argument('<input>', 'Input PPT/PPTX file')
  .option('-o, --output <file>', 'Output JSON file', 'parsed-data.json')
  .action(async (input, options) => {
    console.log(chalk.blue.bold('\n=== PPT Parser ===\n'));

    try {
      const parser = new PPTParser();
      const data = await parser.parse(input);
      await parser.exportToJson(options.output);

      console.log(chalk.green(`\n✓ Parsed successfully`));
      console.log(chalk.gray(`  Slides: ${data.totalSlides}`));
      console.log(chalk.gray(`  Output: ${options.output}`));

    } catch (error) {
      console.error(chalk.red(`\n✗ Error: ${error.message}`));
      process.exit(1);
    }
  });

// Default action (no subcommand)
if (process.argv.length > 2) {
  const firstArg = process.argv[2];

  // If first arg is not a known command and looks like a file, assume convert
  if (!['convert', 'validate-rules', 'export-rules', 'parse', '--help', '-h', '--version', '-V'].includes(firstArg) &&
      (firstArg.endsWith('.pptx') || firstArg.endsWith('.ppt'))) {
    // Insert 'convert' command
    process.argv.splice(2, 0, 'convert');
  }
}

program.parse();

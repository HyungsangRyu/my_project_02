#!/usr/bin/env node

import 'dotenv/config';
import { RuleEngine } from './rules/rule-engine.js';
import { PPTParser } from './parsers/ppt-parser.js';
import { HtmlGenerator } from './generators/html-generator.js';
import { AgentHarness } from './agent/harness.js';

/**
 * Main Application Entry Point
 */
async function main() {
  console.log('=== PPT to HTML Agent ===\n');

  try {
    // Initialize rule engine
    console.log('Initializing rule engine...');
    const ruleEngine = new RuleEngine();
    await ruleEngine.loadDefaultRules();

    // Initialize agent
    console.log('Initializing agent...');
    const agent = new AgentHarness({
      verbose: true
    });
    await agent.initialize(ruleEngine);

    // Interactive mode
    console.log('\n✓ Agent ready!\n');
    console.log('Usage examples:');
    console.log('  - Convert PPT: node src/cli.js input.pptx -o output.html');
    console.log('  - With custom rules: node src/cli.js input.pptx -r custom-rules.yaml -o output.html');
    console.log('  - Validate rules: node src/rules/validator.js rules.yaml');
    console.log('\n');

    // Example: Simple question to agent
    const response = await agent.ask(
      'Explain how the PPT to HTML conversion process works using the harness architecture.'
    );

    if (response.success) {
      console.log('Agent response:');
      console.log(response.result);
      console.log('\nUsage:', response.usage);
    } else {
      console.error('Error:', response.error);
    }

  } catch (error) {
    console.error('Fatal error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  main();
}

export { RuleEngine, PPTParser, HtmlGenerator, AgentHarness };

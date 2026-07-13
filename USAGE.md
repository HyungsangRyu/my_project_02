# Usage Guide

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set up Environment

Copy `.env.example` to `.env` and add your Anthropic API key:

```bash
cp .env.example .env
```

Edit `.env`:
```
ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Basic Conversion

Convert a PPT file to HTML:

```bash
npm run convert input.pptx -o output.html
```

## Command Reference

### Convert PPT to HTML

```bash
# Basic conversion
node src/cli.js convert presentation.pptx

# Specify output file
node src/cli.js convert presentation.pptx -o custom-output.html

# Use custom rules
node src/cli.js convert presentation.pptx -r src/rules/custom/my-rules.yaml

# Use AI agent for intelligent conversion
node src/cli.js convert presentation.pptx --use-agent

# Export parsed data for inspection
node src/cli.js convert presentation.pptx --export-data
```

### Validate Rules

```bash
node src/cli.js validate-rules src/rules/custom/my-rules.yaml
```

### Export Merged Rules

See what the final rules look like after merging defaults with custom:

```bash
node src/cli.js export-rules -r src/rules/custom/my-rules.yaml -o merged.yaml
```

### Parse PPT (Debug Mode)

Extract and view PPT data without generating HTML:

```bash
node src/cli.js parse presentation.pptx -o data.json
```

## Creating Custom Rules

### Step 1: Copy Example

```bash
cp src/rules/custom/example-custom-rules.yaml src/rules/custom/my-rules.yaml
```

### Step 2: Edit Your Rules

Open `my-rules.yaml` and customize:

```yaml
version: "1.0"
category: "custom"
description: "My company's PPT conversion rules"

# Override any default rules
layout:
  container:
    maxWidth: "1600px"  # Your preferred width

typography:
  fonts:
    primary: "'Your Font', sans-serif"

colors:
  brand:
    primary: "#your-color"
```

### Step 3: Validate

```bash
node src/cli.js validate-rules src/rules/custom/my-rules.yaml
```

### Step 4: Use in Conversion

```bash
node src/cli.js convert input.pptx -r src/rules/custom/my-rules.yaml
```

## Rule Categories

### Layout Rules (`layout.yaml`)

Controls spacing, container sizes, responsive breakpoints:

```yaml
layout:
  container:
    maxWidth: "1200px"
  slide:
    aspectRatio: "16:9"
  spacing:
    slideGap: "3rem"
```

### Typography Rules (`typography.yaml`)

Font families, sizes, heading styles:

```yaml
typography:
  fonts:
    primary: "'Inter', sans-serif"
  headings:
    h1:
      fontSize: "2.5rem"
      fontWeight: "700"
```

### Color Rules (`colors.yaml`)

Brand colors, PPT to HTML color mapping:

```yaml
colors:
  brand:
    primary: "#0066cc"
  pptColorMapping:
    themeColors:
      - ppt: "RGB(0,112,192)"
        html: "#0070c0"
```

### Component Rules (`components.yaml`)

HTML element mapping for each PPT component type:

```yaml
components:
  textBox:
    tag: "div"
    className: "text-content"
  bulletList:
    tag: "ul"
    className: "bullet-list"
```

## Using the Agent

The AI agent can make intelligent decisions during conversion:

```bash
node src/cli.js convert presentation.pptx --use-agent
```

The agent will:
- Analyze PPT structure
- Apply appropriate transformations
- Ensure semantic HTML
- Handle edge cases intelligently

## Advanced Usage

### Programmatic API

```javascript
import { RuleEngine, PPTParser, HtmlGenerator, AgentHarness } from './src/index.js';

// Load rules
const rules = new RuleEngine();
await rules.loadDefaultRules();
await rules.loadCustomRules('custom-rules.yaml');

// Parse PPT
const parser = new PPTParser();
const pptData = await parser.parse('input.pptx');

// Generate HTML
const generator = new HtmlGenerator(rules);
const html = await generator.generate(pptData);
await generator.saveToFile(html, 'output.html');
```

### Using Agent Programmatically

```javascript
import { AgentHarness, RuleEngine } from './src/index.js';

const rules = new RuleEngine();
await rules.loadDefaultRules();

const agent = new AgentHarness();
await agent.initialize(rules);

const result = await agent.run(
  'Convert this PPT with extra attention to accessibility',
  { maxIterations: 10 }
);

console.log(result.result);
```

## Examples

See `examples/` directory for:
- Sample PPT files
- Custom rule configurations
- Generated HTML outputs

## Troubleshooting

### "Rules not loaded" error

Make sure to initialize the rule engine:
```javascript
await ruleEngine.loadDefaultRules();
```

### PPT parsing issues

The parser is simplified. For complex PPT files with embedded objects, consider:
1. Using `--export-data` to inspect parsed structure
2. Pre-processing PPT in PowerPoint to simplify
3. Extending the parser for your specific needs

### Agent not producing expected output

- Increase `maxIterations`
- Add more specific instructions in your prompt
- Check verbose output: `--verbose`

## Next Steps

1. Review the generated HTML
2. Customize rules to match your brand
3. Integrate into your workflow
4. Extend the agent with custom tools
5. Add more sophisticated PPT parsing for your use cases

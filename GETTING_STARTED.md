# Getting Started

## Quick Start (5 minutes)

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure API Key

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your Anthropic API key
# Get your key from: https://console.anthropic.com/
```

Your `.env` should look like:
```
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx...
```

### 3. Run Your First Conversion

```bash
# Convert a PPT file (you'll need to provide your own .pptx file)
npm run convert your-presentation.pptx -o output.html
```

That's it! Open `output.html` in your browser.

## Understanding the Project

This agent uses **harness engineering** - a pattern where:

1. **Rules** define HOW to transform PPT elements
2. **Parser** extracts WHAT content exists
3. **Generator** creates HTML using rules
4. **Agent** (optional) makes intelligent decisions

### Project Structure

```
my_project_02/
├── src/
│   ├── agent/           # AI agent harness
│   │   ├── harness.js   # Agent orchestration
│   │   ├── tools.js     # Tools the agent can use
│   │   └── prompts.js   # System prompts
│   │
│   ├── parsers/         # PPT parsing
│   │   ├── ppt-parser.js
│   │   └── content-extractor.js
│   │
│   ├── rules/           # Transformation rules
│   │   ├── defaults/    # Default rule sets
│   │   │   ├── layout.yaml
│   │   │   ├── typography.yaml
│   │   │   ├── colors.yaml
│   │   │   └── components.yaml
│   │   ├── custom/      # Your custom rules
│   │   ├── rule-engine.js
│   │   └── validator.js
│   │
│   ├── generators/      # HTML generation
│   │   ├── html-generator.js
│   │   └── templates/   # Handlebars templates
│   │
│   ├── utils/
│   ├── index.js         # Main entry point
│   └── cli.js           # Command-line interface
│
├── package.json
├── .env                 # Your API key (create this)
├── README.md            # Overview
├── USAGE.md             # Detailed usage guide
└── ARCHITECTURE.md      # Technical architecture
```

## Common Tasks

### Convert with Default Settings

```bash
npm run convert presentation.pptx
```

### Convert with Custom Rules

1. Copy the example rules:
```bash
cp src/rules/custom/example-custom-rules.yaml src/rules/custom/my-rules.yaml
```

2. Edit `my-rules.yaml` to match your preferences

3. Use your rules:
```bash
npm run convert presentation.pptx -r src/rules/custom/my-rules.yaml
```

### Use AI Agent for Intelligent Conversion

```bash
npm run convert presentation.pptx --use-agent
```

The agent will:
- Analyze the PPT structure
- Make intelligent formatting decisions
- Ensure semantic HTML
- Handle edge cases

### Validate Custom Rules

Before using custom rules, validate them:

```bash
node src/cli.js validate-rules src/rules/custom/my-rules.yaml
```

### Debug: See What Was Parsed

Export the parsed PPT data to inspect:

```bash
node src/cli.js parse presentation.pptx -o data.json
```

Open `data.json` to see the extracted structure.

## Customizing Rules

Rules are defined in YAML files. They control every aspect of the conversion.

### Example: Change Heading Sizes

Edit `src/rules/custom/my-rules.yaml`:

```yaml
typography:
  headings:
    h1:
      fontSize: "3rem"      # Larger than default
      color: "#0066cc"      # Brand blue
```

### Example: Custom Color Mapping

Map specific PPT colors to your brand colors:

```yaml
colors:
  brand:
    primary: "#0066cc"
    accent: "#ff6b35"

  pptColorMapping:
    themeColors:
      - ppt: "RGB(0,112,192)"
        html: "#0066cc"
        name: "Company Blue"
```

### Example: Change Component HTML

Transform bullet lists differently:

```yaml
components:
  bulletList:
    tag: "ul"
    className: "custom-bullets"
    styles:
      default:
        listStyleType: "none"  # No bullets
        paddingLeft: "0"
```

See [USAGE.md](USAGE.md) for detailed rule documentation.

## Understanding the Agent

The agent is optional but provides intelligent conversion.

### When to Use the Agent

- Complex presentations with inconsistent formatting
- Need semantic HTML decisions
- Want accessibility improvements
- Unusual PPT structures

### When to Skip the Agent

- Simple, well-formatted presentations
- Batch processing (faster without agent)
- Want deterministic output
- Testing rule changes

### How the Agent Works

1. Loads transformation rules into its system prompt
2. Receives parsed PPT data
3. Uses tools to query rules and generate HTML
4. Iterates until complete

### Example Agent Usage

```bash
# Ask the agent to prioritize accessibility
npm run convert presentation.pptx --use-agent
```

The agent has access to these tools:
- `get_rule` - Query transformation rules
- `map_color` - Convert PPT colors
- `map_font` - Convert fonts
- `convert_font_size` - Convert sizes
- `generate_html_element` - Create HTML
- `validate_html` - Check output quality

## Troubleshooting

### "ANTHROPIC_API_KEY is required"

Create a `.env` file with your API key:
```
ANTHROPIC_API_KEY=sk-ant-...
```

### "Failed to parse PPT file"

The parser is simplified. Try:
1. Open the PPT in PowerPoint
2. Save as a new PPTX file
3. Try conversion again

Or use `--export-data` to see what was parsed.

### Rules Not Applied

Make sure you're passing the `-r` flag:
```bash
npm run convert file.pptx -r src/rules/custom/my-rules.yaml
```

Validate your rules first:
```bash
node src/cli.js validate-rules src/rules/custom/my-rules.yaml
```

### HTML Looks Wrong

1. Check the generated CSS in the HTML `<style>` tag
2. Verify your rules with `export-rules`:
```bash
node src/cli.js export-rules -r my-rules.yaml -o merged.yaml
cat merged.yaml
```

## Next Steps

1. **Read [USAGE.md](USAGE.md)** - Comprehensive usage guide
2. **Read [ARCHITECTURE.md](ARCHITECTURE.md)** - Understand the system design
3. **Customize Rules** - Make it work for your specific needs
4. **Extend the Agent** - Add custom tools or prompts
5. **Improve the Parser** - Add support for more PPT elements

## Example Workflow

Here's a typical workflow for converting your company's presentations:

### 1. Create Company Rules

```bash
cp src/rules/custom/example-custom-rules.yaml src/rules/custom/acme-corp.yaml
```

Edit `acme-corp.yaml`:
```yaml
colors:
  brand:
    primary: "#your-brand-color"

typography:
  fonts:
    primary: "'Your Company Font', sans-serif"
```

### 2. Test on One Slide

Convert a simple presentation first:
```bash
npm run convert test-slide.pptx -r src/rules/custom/acme-corp.yaml
```

### 3. Refine Rules

Open the generated HTML, see what needs adjustment, update rules, repeat.

### 4. Validate

```bash
node src/cli.js validate-rules src/rules/custom/acme-corp.yaml
```

### 5. Production Use

```bash
npm run convert quarterly-review.pptx -r src/rules/custom/acme-corp.yaml -o output.html
```

## Getting Help

- Check [USAGE.md](USAGE.md) for detailed commands
- Check [ARCHITECTURE.md](ARCHITECTURE.md) for technical details
- Review the example rules in `src/rules/custom/`
- Inspect parsed data with `npm run convert file.pptx --export-data`

## What Makes This Different?

Traditional PPT converters:
- Fixed transformation logic (hard-coded)
- No customization
- Poor semantic HTML

This agent:
- ✅ **Rule-driven** - Customize every transformation
- ✅ **AI-powered** - Intelligent decisions (optional)
- ✅ **Semantic HTML** - Proper document structure
- ✅ **Extensible** - Add new components, tools, rules
- ✅ **Harness pattern** - Clear separation of concerns

Enjoy building with the PPT to HTML Agent! 🚀

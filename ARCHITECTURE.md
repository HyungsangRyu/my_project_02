# PPT to HTML Agent Architecture

## Overview

This project implements a **harness engineering** pattern for converting PowerPoint presentations to HTML. The architecture separates concerns into distinct layers: parsing, rules, generation, and AI orchestration.

## Architectural Principles

1. **Rule-Driven Transformation**: All PPT→HTML mappings defined in declarative YAML rules
2. **Agent Harness**: Claude AI agent orchestrates conversion using tools
3. **Separation of Concerns**: Parser, rules, generator, and agent are independent modules
4. **Extensibility**: Easy to add new rules, components, or transformation logic
5. **Progressive Enhancement**: Works with or without the AI agent

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         User / CLI                          │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Direct Mode  │  │ Agent Mode   │  │  Rule Tools  │
│ (Template)   │  │ (AI-Powered) │  │  (Validate)  │
└──────┬───────┘  └──────┬───────┘  └──────────────┘
       │                 │
       │        ┌────────┴────────┐
       │        │                 │
       │        ▼                 │
       │  ┌──────────────────┐   │
       │  │  Agent Harness   │   │
       │  │  - Tools         │   │
       │  │  - Prompts       │   │
       │  │  - Agentic Loop  │   │
       │  └─────────┬────────┘   │
       │            │             │
       └────────────┼─────────────┘
                    │
       ┌────────────┼────────────┐
       │            │            │
       ▼            ▼            ▼
┌─────────────┐ ┌──────────┐ ┌───────────────┐
│ PPT Parser  │ │  Rules   │ │ HTML Generator│
│             │ │  Engine  │ │               │
│ - Extract   │ │          │ │ - Templates   │
│ - Structure │ │ - Load   │ │ - CSS Gen     │
│ - Content   │ │ - Merge  │ │ - Transform   │
└─────────────┘ │ - Map    │ └───────────────┘
                └──────────┘
```

## Core Components

### 1. Rule Engine (`src/rules/`)

**Purpose**: Load, merge, validate, and apply transformation rules

**Files**:
- `rule-engine.js` - Core rule management
- `validator.js` - Rule validation
- `defaults/*.yaml` - Default rule sets
- `custom/*.yaml` - User-customizable rules

**Key Features**:
- Deep merge of custom rules over defaults
- Category-based organization (layout, typography, colors, components)
- PPT→HTML mapping functions
- Rule export for debugging

**Example**:
```javascript
const rules = new RuleEngine();
await rules.loadDefaultRules();
await rules.loadCustomRules('custom.yaml');

const htmlColor = rules.mapColor('RGB(0,112,192)');
const webFont = rules.mapFont('Calibri');
```

### 2. PPT Parser (`src/parsers/`)

**Purpose**: Extract structured content from PPTX files

**Files**:
- `ppt-parser.js` - Main parser
- `content-extractor.js` - Content classification

**Process**:
1. Read PPTX as ZIP archive (using PizZip)
2. Extract XML from slides
3. Parse text, shapes, tables, images
4. Classify content types (heading, list, paragraph, etc.)
5. Return structured JSON

**Limitations**:
- Simplified XML parsing (regex-based)
- Limited support for complex elements
- For production, consider robust libraries or external services

**Example**:
```javascript
const parser = new PPTParser();
const data = await parser.parse('presentation.pptx');

console.log(data.metadata);  // { title, author, created, ... }
console.log(data.slides);    // [{ slideNumber, title, content, ... }]
```

### 3. HTML Generator (`src/generators/`)

**Purpose**: Transform parsed PPT data into HTML using rules and templates

**Files**:
- `html-generator.js` - Generation logic
- `templates/base.hbs` - Main HTML structure
- `templates/slide.hbs` - Slide template
- `templates/components/*.hbs` - Component partials

**Process**:
1. Load Handlebars templates
2. Transform PPT data using rules
3. Generate CSS from rule definitions
4. Compile templates with data
5. Output complete HTML document

**Features**:
- Rule-based component transformation
- Dynamic CSS generation
- Responsive design
- Accessibility features

**Example**:
```javascript
const generator = new HtmlGenerator(ruleEngine);
const html = await generator.generate(pptData);
await generator.saveToFile(html, 'output.html');
```

### 4. Agent Harness (`src/agent/`)

**Purpose**: AI-powered conversion with intelligent decision-making

**Files**:
- `harness.js` - Agent orchestration
- `tools.js` - Tool definitions and handlers
- `prompts.js` - System and user prompts

**Architecture**:
```
User Request
    ↓
System Prompt (with rules context)
    ↓
Agentic Loop:
  ├─→ Agent reasoning
  ├─→ Tool calls
  │   ├─ get_rule
  │   ├─ map_color
  │   ├─ map_font
  │   ├─ convert_font_size
  │   ├─ generate_html_element
  │   └─ validate_html
  ├─→ Tool results
  └─→ Continue until done
    ↓
HTML Output
```

**Tools Available**:

1. **`get_rule`** - Retrieve transformation rules
2. **`map_color`** - Convert PPT color to HTML
3. **`map_font`** - Map PPT font to web font
4. **`convert_font_size`** - Convert points to rem
5. **`generate_html_element`** - Create HTML from PPT component
6. **`validate_html`** - Check HTML quality

**Example**:
```javascript
const agent = new AgentHarness();
await agent.initialize(ruleEngine);
agent.setPPTData(pptData);

const result = await agent.run(
  'Convert this presentation to accessible HTML',
  { maxIterations: 10 }
);
```

## Data Flow

### Direct Mode (Template-Based)

```
PPT File
  ↓ [PPT Parser]
Parsed Data (JSON)
  ↓ [Rule Engine]
Transformed Data
  ↓ [HTML Generator]
HTML Output
```

### Agent Mode (AI-Powered)

```
PPT File
  ↓ [PPT Parser]
Parsed Data (JSON)
  ↓
Agent Harness
  ├─ System Prompt + Rules
  ├─ PPT Data Context
  └─ Agentic Loop:
      ├─ Analyze structure
      ├─ Call tools (get_rule, map_color, etc.)
      ├─ Generate HTML elements
      ├─ Validate output
      └─ Iterate
  ↓
HTML Output
```

## Rule System

### Rule Hierarchy

```
Default Rules (src/rules/defaults/)
  ├─ layout.yaml
  ├─ typography.yaml
  ├─ colors.yaml
  └─ components.yaml
       ↓ [Deep Merge]
Custom Rules (src/rules/custom/*.yaml)
       ↓
Final Rules (applied to conversion)
```

### Rule Categories

1. **Layout** - Container sizes, spacing, responsive breakpoints
2. **Typography** - Fonts, sizes, headings, lists
3. **Colors** - Brand colors, PPT→HTML mapping
4. **Components** - HTML element mapping for each PPT component type

### Rule Application

```javascript
// Example: Bullet List Transformation

PPT Element:
{
  type: "bulletList",
  items: ["Item 1", "Item 2"]
}

Component Rule:
{
  tag: "ul",
  className: "bullet-list",
  itemTag: "li",
  styles: { ... }
}

Generated HTML:
<ul class="bullet-list">
  <li>Item 1</li>
  <li>Item 2</li>
</ul>
```

## Extensibility Points

### 1. Add New Component Type

Edit `src/rules/defaults/components.yaml`:

```yaml
newComponent:
  tag: "div"
  className: "new-component"
  attributes:
    role: "region"
```

Update `html-generator.js` to handle transformation.

### 2. Add New Agent Tool

Edit `src/agent/tools.js`:

```javascript
export const tools = [
  // ... existing tools
  {
    name: 'new_tool',
    description: 'Does something useful',
    input_schema: { ... }
  }
];

// Add handler
function handleNewTool(input, context) {
  // Implementation
}
```

### 3. Add Custom Template

Create `src/generators/templates/custom.hbs`:

```handlebars
<div class="custom">
  {{#each items}}
    {{{this}}}
  {{/each}}
</div>
```

Register in `html-generator.js`.

### 4. Extend Parser

Edit `src/parsers/ppt-parser.js` to extract new element types:

```javascript
extractNewElement(slideXml) {
  // Parse specific PPT element
  return parsedData;
}
```

## Error Handling

### Rule Validation

```javascript
const validator = new RuleValidator();
const result = await validator.validateFile('custom.yaml');

if (!result.valid) {
  console.error('Validation errors:', result.errors);
}
```

### Agent Error Recovery

The agent harness handles tool errors gracefully:
- Returns `is_error: true` in tool result
- Agent can retry or adjust approach
- Max iterations prevents infinite loops

### Parsing Errors

```javascript
try {
  const data = await parser.parse('file.pptx');
} catch (error) {
  console.error('Parse failed:', error.message);
  // Fallback or user notification
}
```

## Performance Considerations

1. **Rule Loading**: Rules loaded once at startup, cached
2. **Template Compilation**: Handlebars templates compiled once
3. **Agent Iterations**: Limited by `maxIterations` parameter
4. **PPT Parsing**: Memory-efficient ZIP streaming (via PizZip)

## Testing Strategy

1. **Unit Tests**: Test individual modules (parser, rules, generator)
2. **Integration Tests**: Test full conversion pipeline
3. **Rule Validation**: Automated rule syntax checking
4. **Sample PPTs**: Test with variety of real-world presentations
5. **Agent Behavior**: Verify tool calls and outputs

## Security Considerations

1. **Input Validation**: Validate PPTX file integrity
2. **XML Parsing**: Prevent XXE attacks (use safe parsers)
3. **HTML Generation**: Escape user content to prevent XSS
4. **API Keys**: Never commit `.env` file
5. **File Paths**: Sanitize file paths to prevent traversal

## Future Enhancements

1. **Enhanced Parser**: Use professional PPT parsing library
2. **Interactive Editor**: Web UI for rule customization
3. **Batch Processing**: Convert multiple PPTs
4. **Template Gallery**: Pre-built rule sets for common use cases
5. **Export Formats**: PDF, Markdown, DOCX outputs
6. **Collaboration**: Multi-agent verification of conversion quality
7. **Analytics**: Track conversion quality metrics

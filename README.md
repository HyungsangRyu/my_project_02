# PPT to HTML Agent (node.js)

AI-powered PPT to HTML conversion agent using Claude with rule-based transformation system.

## 🎯 Overview

This agent converts PowerPoint presentations to HTML documents using:
- **Claude AI** for intelligent content transformation
- **Rule-based system** for consistent, customizable conversions
- **Template engine** for flexible HTML output
- **Harness engineering** pattern for robust agent architecture

## 🏗️ Architecture

```
src/
├── index.js              # Main agent harness
├── cli.js                # CLI interface
├── agent/
│   ├── harness.js        # Agent orchestration
│   ├── tools.js          # Agent tools definition
│   └── prompts.js        # System prompts
├── parsers/
│   ├── ppt-parser.js     # PPT extraction
│   └── content-extractor.js
├── rules/
│   ├── rule-engine.js    # Rule processing
│   ├── validator.js      # Rule validation
│   └── defaults/         # Default rule sets
│       ├── layout.yaml
│       ├── typography.yaml
│       ├── colors.yaml
│       └── components.yaml
├── generators/
│   ├── html-generator.js # HTML output
│   └── templates/        # Handlebars templates
│       ├── base.hbs
│       ├── slide.hbs
│       └── components/
└── utils/
    ├── logger.js
    └── file-handler.js
```

## 📋 Rule System

Rules are defined in YAML format with precise transformation instructions:

### Rule Structure
```yaml
# rules/custom/my-rules.yaml
version: "1.0"
metadata:
  name: "Corporate Template Rules"
  description: "Rules for corporate PPT conversion"
  author: "Your Name"
  created: "2026-07-13"

# Layout rules
layout:
  containerWidth: "1200px"
  slideAspectRatio: "16:9"
  spacing:
    section: "4rem"
    slide: "2rem"
  
# Typography rules
typography:
  headings:
    h1:
      fontFamily: "Arial, sans-serif"
      fontSize: "2.5rem"
      fontWeight: "700"
      color: "#1a1a1a"
      lineHeight: "1.2"
      marginBottom: "1.5rem"
    h2:
      fontSize: "2rem"
      fontWeight: "600"
    h3:
      fontSize: "1.5rem"
      fontWeight: "500"
  
  body:
    fontFamily: "Arial, sans-serif"
    fontSize: "1rem"
    lineHeight: "1.6"
    color: "#333333"
  
  lists:
    bulletStyle: "disc"
    indentSize: "1.5rem"
    itemSpacing: "0.5rem"

# Color mapping
colors:
  primary: "#0066cc"
  secondary: "#6c757d"
  accent: "#28a745"
  background: "#ffffff"
  text: "#212529"
  
  # PPT color to HTML color mapping
  mapping:
    - ppt: "RGB(0,112,192)"
      html: "#0070c0"
      semantic: "primary"
    - ppt: "RGB(255,192,0)"
      html: "#ffc000"
      semantic: "accent"

# Component transformation rules
components:
  textBox:
    tag: "div"
    className: "text-content"
    preserveFormatting: true
    
  bulletList:
    tag: "ul"
    className: "bullet-list"
    itemTag: "li"
    nestingSupport: true
    
  image:
    tag: "img"
    className: "slide-image"
    preserveAspectRatio: true
    responsiveBreakpoints:
      - size: "768px"
        maxWidth: "100%"
      - size: "1024px"
        maxWidth: "80%"
    
  table:
    tag: "table"
    className: "data-table"
    headerRow: true
    stripedRows: true
    responsive: true
    
  shape:
    rectangle:
      tag: "div"
      className: "shape-box"
    circle:
      tag: "div"
      className: "shape-circle"
    arrow:
      tag: "span"
      className: "arrow"
      useIcon: true

# Animation and transitions
animations:
  enabled: false
  cssOnly: true
  effects:
    fadeIn: true
    slideIn: false
    
# Accessibility rules
accessibility:
  altTextRequired: true
  ariaLabels: true
  headingHierarchy: true
  colorContrastCheck: true
  minContrastRatio: 4.5

# Output settings
output:
  minify: false
  inlineStyles: false
  separateCSS: true
  includeMetadata: true
  responsive: true
  darkModeSupport: false
```

## 🚀 Usage

### Basic Conversion
```bash
npm run convert -- input.pptx -o output.html
```

### With Custom Rules
```bash
npm run convert -- input.pptx -r rules/custom/my-rules.yaml -o output.html
```

### Interactive Mode (with Claude)
```bash
npm start
```

## 🔧 Configuration

Create `.env` file:
```
ANTHROPIC_API_KEY=your_api_key_here
MODEL=claude-sonnet-4-5-20250929
MAX_TOKENS=4096
```

## 📝 Extending Rules

1. Copy a default rule file from `src/rules/defaults/`
2. Modify to match your requirements
3. Validate: `node src/rules/validator.js your-rules.yaml`
4. Use in conversion: `--rules your-rules.yaml`

## 🎨 Custom Templates

Create custom HTML templates in `src/generators/templates/`:

```handlebars
{{!-- templates/custom-slide.hbs --}}
<section class="slide" data-slide-number="{{slideNumber}}">
  <header>
    <h2>{{title}}</h2>
  </header>
  
  <div class="slide-content">
    {{#each content}}
      {{{this}}}
    {{/each}}
  </div>
  
  {{#if footer}}
  <footer>
    {{footer}}
  </footer>
  {{/if}}
</section>
```

## 🔍 Examples

See `examples/` directory for sample conversions and rule configurations.

## 📄 License

MIT

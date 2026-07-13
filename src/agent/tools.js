/**
 * Tool definitions and handlers for the agent
 */

/**
 * Tool definitions in Anthropic format
 */
export const tools = [
  {
    name: 'get_rule',
    description: 'Get transformation rules for a specific category (layout, typography, colors, components) or component type',
    input_schema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: ['layout', 'typography', 'colors', 'components'],
          description: 'The rule category to retrieve'
        },
        componentType: {
          type: 'string',
          description: 'Optional: specific component type within the components category (e.g., "textBox", "bulletList", "image")'
        }
      },
      required: ['category']
    }
  },
  {
    name: 'map_color',
    description: 'Map a PPT color to HTML color using the color transformation rules',
    input_schema: {
      type: 'object',
      properties: {
        pptColor: {
          type: 'string',
          description: 'PPT color in format "RGB(r,g,b)" or hex'
        }
      },
      required: ['pptColor']
    }
  },
  {
    name: 'map_font',
    description: 'Map a PPT font to web-safe font using typography rules',
    input_schema: {
      type: 'object',
      properties: {
        pptFont: {
          type: 'string',
          description: 'PPT font name (e.g., "Arial", "Calibri")'
        }
      },
      required: ['pptFont']
    }
  },
  {
    name: 'convert_font_size',
    description: 'Convert PPT font size (in points) to rem units',
    input_schema: {
      type: 'object',
      properties: {
        pptSizePoints: {
          type: 'number',
          description: 'Font size in PPT points'
        }
      },
      required: ['pptSizePoints']
    }
  },
  {
    name: 'generate_html_element',
    description: 'Generate HTML element for a PPT component using transformation rules',
    input_schema: {
      type: 'object',
      properties: {
        componentType: {
          type: 'string',
          description: 'Type of component (textBox, bulletList, image, table, etc.)'
        },
        content: {
          type: 'object',
          description: 'Content data from PPT element'
        },
        styles: {
          type: 'object',
          description: 'Optional: additional inline styles'
        }
      },
      required: ['componentType', 'content']
    }
  },
  {
    name: 'validate_html',
    description: 'Validate generated HTML for semantic correctness and accessibility',
    input_schema: {
      type: 'object',
      properties: {
        html: {
          type: 'string',
          description: 'HTML content to validate'
        }
      },
      required: ['html']
    }
  }
];

/**
 * Process tool calls
 */
export async function processToolCall(toolName, input, context) {
  const { rules, pptData } = context;

  switch (toolName) {
    case 'get_rule':
      return handleGetRule(input, rules);

    case 'map_color':
      return handleMapColor(input, rules);

    case 'map_font':
      return handleMapFont(input, rules);

    case 'convert_font_size':
      return handleConvertFontSize(input, rules);

    case 'generate_html_element':
      return handleGenerateHtmlElement(input, rules);

    case 'validate_html':
      return handleValidateHtml(input);

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

/**
 * Get rule handler
 */
function handleGetRule(input, ruleEngine) {
  const { category, componentType } = input;

  if (!ruleEngine) {
    return { error: 'Rules not loaded' };
  }

  switch (category) {
    case 'layout':
      return ruleEngine.getLayoutRules();

    case 'typography':
      return ruleEngine.getTypographyRules();

    case 'colors':
      return ruleEngine.getColorRules();

    case 'components':
      if (componentType) {
        return ruleEngine.getComponentRule(componentType);
      } else {
        return ruleEngine.getAllRules().components;
      }

    default:
      return { error: `Unknown category: ${category}` };
  }
}

/**
 * Map color handler
 */
function handleMapColor(input, ruleEngine) {
  const { pptColor } = input;

  if (!ruleEngine) {
    return { htmlColor: pptColor };
  }

  const htmlColor = ruleEngine.mapColor(pptColor);

  return {
    pptColor: pptColor,
    htmlColor: htmlColor
  };
}

/**
 * Map font handler
 */
function handleMapFont(input, ruleEngine) {
  const { pptFont } = input;

  if (!ruleEngine) {
    return { webFont: pptFont };
  }

  const webFont = ruleEngine.mapFont(pptFont);

  return {
    pptFont: pptFont,
    webFont: webFont
  };
}

/**
 * Convert font size handler
 */
function handleConvertFontSize(input, ruleEngine) {
  const { pptSizePoints } = input;

  if (!ruleEngine) {
    // Default conversion
    const remSize = (pptSizePoints * 1.333) / 16;
    return {
      pptSize: `${pptSizePoints}pt`,
      remSize: `${remSize.toFixed(3)}rem`
    };
  }

  const remSize = ruleEngine.convertFontSize(pptSizePoints);

  return {
    pptSize: `${pptSizePoints}pt`,
    remSize: remSize
  };
}

/**
 * Generate HTML element handler
 */
function handleGenerateHtmlElement(input, ruleEngine) {
  const { componentType, content, styles = {} } = input;

  if (!ruleEngine) {
    return {
      error: 'Rules not loaded',
      fallback: `<div>${JSON.stringify(content)}</div>`
    };
  }

  // Get component rule
  const rule = ruleEngine.getComponentRule(componentType);

  if (!rule) {
    return {
      error: `No rule found for component type: ${componentType}`,
      fallback: `<div>${JSON.stringify(content)}</div>`
    };
  }

  // Generate HTML based on rule
  const tag = rule.tag || 'div';
  const className = rule.className || '';
  const attributes = rule.attributes || {};

  // Build attributes string
  let attrsString = '';

  if (className) {
    attrsString += ` class="${className}"`;
  }

  Object.entries(attributes).forEach(([key, value]) => {
    attrsString += ` ${key}="${value}"`;
  });

  // Simple HTML generation (can be enhanced)
  const html = `<${tag}${attrsString}>${JSON.stringify(content)}</${tag}>`;

  return {
    componentType: componentType,
    html: html,
    rule: rule
  };
}

/**
 * Validate HTML handler
 */
function handleValidateHtml(input) {
  const { html } = input;

  // Basic validation (can be enhanced with real HTML parser)
  const issues = [];

  // Check for basic structure
  if (!html.includes('<')) {
    issues.push('No HTML tags found');
  }

  // Check for unclosed tags (very basic)
  const openTags = (html.match(/<[^/][^>]*>/g) || []).length;
  const closeTags = (html.match(/<\/[^>]+>/g) || []).length;

  if (openTags !== closeTags) {
    issues.push(`Possible unclosed tags: ${openTags} open, ${closeTags} close`);
  }

  // Check for semantic elements
  const semanticTags = ['header', 'main', 'article', 'section', 'nav', 'aside', 'footer'];
  const hasSemanticTags = semanticTags.some(tag => html.includes(`<${tag}`));

  if (!hasSemanticTags) {
    issues.push('Consider using semantic HTML5 elements');
  }

  // Check for accessibility
  const hasImgWithoutAlt = /<img(?![^>]*alt=)/i.test(html);
  if (hasImgWithoutAlt) {
    issues.push('Images should have alt attributes');
  }

  return {
    valid: issues.length === 0,
    issues: issues,
    warnings: issues.length > 0 ? issues : []
  };
}

export default {
  tools,
  processToolCall
};

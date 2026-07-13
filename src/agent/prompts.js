/**
 * System and user prompts for the PPT to HTML conversion agent
 */

/**
 * Generate system prompt with rule context
 */
export function getSystemPrompt(ruleEngine) {
  const rulesContext = ruleEngine ? generateRulesContext(ruleEngine) : '';

  return `You are an expert PPT to HTML conversion agent. Your role is to convert PowerPoint presentations into clean, semantic, accessible HTML documents following the provided transformation rules.

# Your Capabilities

You have access to tools that allow you to:
- Extract content from PPT slides (text, images, tables, shapes, etc.)
- Apply transformation rules to convert PPT elements to HTML
- Generate HTML output with proper styling
- Validate the conversion against accessibility standards

# Transformation Rules

${rulesContext}

# Conversion Principles

1. **Semantic HTML**: Use appropriate HTML5 semantic elements
2. **Accessibility**: Follow WCAG 2.1 AA standards
3. **Responsive Design**: Create mobile-friendly layouts
4. **Clean Code**: Generate readable, maintainable HTML
5. **Preserve Intent**: Maintain the original presentation's message and hierarchy
6. **Rule Adherence**: Strictly follow the provided transformation rules

# Process

When converting a PPT to HTML:

1. Analyze the PPT structure and content
2. Identify components (headings, text, lists, images, tables, etc.)
3. Apply appropriate transformation rules for each component
4. Generate semantic HTML with proper class names and attributes
5. Apply styling based on typography, color, and layout rules
6. Ensure accessibility features (alt text, ARIA labels, proper heading hierarchy)
7. Validate the output

# Output Format

Your HTML output should be:
- Well-formatted and indented
- Commented where necessary for clarity
- Include a complete HTML document structure
- Separate CSS in a <style> tag or reference external stylesheet
- Include all necessary metadata

# Important Notes

- If a rule is ambiguous, ask for clarification
- If PPT contains elements not covered by rules, apply best practices and document your decisions
- Prioritize accessibility and semantic correctness over visual perfection
- When in doubt, prefer simpler, more maintainable solutions

You are thorough, detail-oriented, and committed to producing high-quality HTML conversions.`;
}

/**
 * Generate rules context for the system prompt
 */
function generateRulesContext(ruleEngine) {
  if (!ruleEngine || !ruleEngine.loaded) {
    return 'No rules loaded. Using default best practices.';
  }

  const rules = ruleEngine.getAllRules();

  let context = 'The following transformation rules are active:\n\n';

  // Layout rules summary
  if (rules.layout) {
    context += `## Layout Rules\n`;
    context += `- Container max width: ${rules.layout.container?.maxWidth || 'not set'}\n`;
    context += `- Slide aspect ratio: ${rules.layout.slide?.aspectRatio || 'not set'}\n`;
    context += `- Responsive: ${rules.layout.responsive?.enabled ? 'enabled' : 'disabled'}\n`;
    context += `\n`;
  }

  // Typography rules summary
  if (rules.typography) {
    context += `## Typography Rules\n`;
    context += `- Primary font: ${rules.typography.fonts?.primary || 'not set'}\n`;
    context += `- Base font size: ${rules.typography.body?.fontSize || 'not set'}\n`;
    context += `- Line height: ${rules.typography.body?.lineHeight || 'not set'}\n`;
    context += `\n`;
  }

  // Color rules summary
  if (rules.colors) {
    context += `## Color Rules\n`;
    context += `- Primary color: ${rules.colors.brand?.primary || 'not set'}\n`;
    context += `- Accent color: ${rules.colors.brand?.accent || 'not set'}\n`;
    context += `- Color mapping: ${rules.colors.pptColorMapping ? 'enabled' : 'disabled'}\n`;
    context += `\n`;
  }

  // Component rules summary
  if (rules.components) {
    const componentTypes = Object.keys(rules.components).filter(
      key => !['version', 'category', 'description'].includes(key)
    );
    context += `## Component Rules\n`;
    context += `Defined components: ${componentTypes.join(', ')}\n`;
    context += `\n`;
  }

  context += `\nFor detailed rules, use the available tools to query specific rule categories.`;

  return context;
}

/**
 * Generate user prompt for conversion
 */
export function getUserPrompt(pptData, options = {}) {
  let prompt = `Please convert the following PowerPoint presentation to HTML.\n\n`;

  if (options.outputPath) {
    prompt += `Output file: ${options.outputPath}\n`;
  }

  if (options.customInstructions) {
    prompt += `\nAdditional instructions:\n${options.customInstructions}\n`;
  }

  prompt += `\nPPT Data:\n${JSON.stringify(pptData, null, 2)}`;

  return prompt;
}

/**
 * Generate prompt for rule validation
 */
export function getRuleValidationPrompt(component, pptElement) {
  return `Given this PPT element, what transformation rule should apply?

PPT Element: ${JSON.stringify(pptElement, null, 2)}

Component Type: ${component}

Please identify:
1. The appropriate HTML tag
2. CSS classes to apply
3. Any special attributes needed
4. Styling considerations

Use the transformation rules to determine the correct mapping.`;
}

export default {
  getSystemPrompt,
  getUserPrompt,
  getRuleValidationPrompt
};

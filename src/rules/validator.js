import fs from 'fs/promises';
import yaml from 'js-yaml';

/**
 * Rule Validator - Validates rule YAML files for correctness
 */
export class RuleValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Validate a rule file
   */
  async validateFile(filePath) {
    this.errors = [];
    this.warnings = [];

    try {
      // Read and parse YAML
      const content = await fs.readFile(filePath, 'utf8');
      const rules = yaml.load(content);

      // Validate structure
      this.validateVersion(rules);
      this.validateCategory(rules);
      this.validateDescription(rules);

      // Category-specific validation
      if (rules.category) {
        switch (rules.category) {
          case 'layout':
            this.validateLayoutRules(rules);
            break;
          case 'typography':
            this.validateTypographyRules(rules);
            break;
          case 'colors':
            this.validateColorRules(rules);
            break;
          case 'components':
            this.validateComponentRules(rules);
            break;
        }
      }

      // Return validation result
      return {
        valid: this.errors.length === 0,
        errors: this.errors,
        warnings: this.warnings
      };

    } catch (error) {
      this.errors.push(`Failed to parse YAML: ${error.message}`);
      return {
        valid: false,
        errors: this.errors,
        warnings: this.warnings
      };
    }
  }

  /**
   * Validate version field
   */
  validateVersion(rules) {
    if (!rules.version) {
      this.errors.push('Missing required field: version');
    } else if (typeof rules.version !== 'string') {
      this.errors.push('version must be a string');
    }
  }

  /**
   * Validate category field
   */
  validateCategory(rules) {
    const validCategories = ['layout', 'typography', 'colors', 'components', 'custom'];

    if (!rules.category) {
      this.errors.push('Missing required field: category');
    } else if (!validCategories.includes(rules.category)) {
      this.errors.push(`Invalid category. Must be one of: ${validCategories.join(', ')}`);
    }
  }

  /**
   * Validate description field
   */
  validateDescription(rules) {
    if (!rules.description) {
      this.warnings.push('Missing recommended field: description');
    }
  }

  /**
   * Validate layout rules
   */
  validateLayoutRules(rules) {
    // Check for common layout properties
    if (!rules.container && !rules.slide && !rules.spacing) {
      this.warnings.push('Layout rules should define container, slide, or spacing properties');
    }

    // Validate responsive breakpoints if present
    if (rules.breakpoints) {
      this.validateBreakpoints(rules.breakpoints);
    }
  }

  /**
   * Validate typography rules
   */
  validateTypographyRules(rules) {
    // Check for font definitions
    if (!rules.fonts && !rules.headings && !rules.body) {
      this.warnings.push('Typography rules should define fonts, headings, or body text');
    }

    // Validate heading hierarchy
    if (rules.headings) {
      const headingLevels = Object.keys(rules.headings);
      const validHeadings = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

      headingLevels.forEach(level => {
        if (!validHeadings.includes(level)) {
          this.errors.push(`Invalid heading level: ${level}`);
        }
      });
    }
  }

  /**
   * Validate color rules
   */
  validateColorRules(rules) {
    // Check for color definitions
    if (!rules.brand && !rules.base && !rules.semantic) {
      this.warnings.push('Color rules should define brand, base, or semantic colors');
    }

    // Validate color formats
    if (rules.brand) {
      this.validateColorValues(rules.brand, 'brand');
    }

    if (rules.base) {
      this.validateColorValues(rules.base, 'base');
    }

    // Validate PPT color mappings
    if (rules.pptColorMapping?.themeColors) {
      rules.pptColorMapping.themeColors.forEach((mapping, index) => {
        if (!mapping.ppt || !mapping.html) {
          this.errors.push(`Color mapping at index ${index} missing ppt or html value`);
        } else {
          this.validateColorFormat(mapping.html, `pptColorMapping.themeColors[${index}].html`);
        }
      });
    }
  }

  /**
   * Validate component rules
   */
  validateComponentRules(rules) {
    // Component rules can be very flexible, so just check basic structure
    const componentTypes = Object.keys(rules).filter(
      key => !['version', 'category', 'description'].includes(key)
    );

    if (componentTypes.length === 0) {
      this.warnings.push('No component definitions found');
    }

    // Validate each component has a tag
    componentTypes.forEach(type => {
      const component = rules[type];
      if (typeof component === 'object' && !component.tag) {
        this.warnings.push(`Component '${type}' should define a tag property`);
      }
    });
  }

  /**
   * Validate breakpoint values
   */
  validateBreakpoints(breakpoints) {
    Object.entries(breakpoints).forEach(([name, value]) => {
      if (typeof value !== 'string' || !value.match(/^\d+px$/)) {
        this.errors.push(`Invalid breakpoint value for '${name}': ${value} (should be like '768px')`);
      }
    });
  }

  /**
   * Validate color values in an object
   */
  validateColorValues(colorObject, path) {
    Object.entries(colorObject).forEach(([key, value]) => {
      if (typeof value === 'string') {
        this.validateColorFormat(value, `${path}.${key}`);
      }
    });
  }

  /**
   * Validate color format (hex, rgb, rgba, hsl, etc.)
   */
  validateColorFormat(color, path) {
    const validFormats = [
      /^#[0-9A-Fa-f]{3}$/,        // #fff
      /^#[0-9A-Fa-f]{6}$/,        // #ffffff
      /^#[0-9A-Fa-f]{8}$/,        // #ffffffff
      /^rgb\(/,                    // rgb(...)
      /^rgba\(/,                   // rgba(...)
      /^hsl\(/,                    // hsl(...)
      /^hsla\(/,                   // hsla(...)
      /^[a-z]+$/i                  // named colors (red, blue, etc.)
    ];

    const isValid = validFormats.some(regex => regex.test(color));

    if (!isValid) {
      this.warnings.push(`Possibly invalid color format at ${path}: ${color}`);
    }
  }

  /**
   * Print validation results
   */
  printResults() {
    console.log('\n=== Validation Results ===\n');

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('✓ No issues found');
      return;
    }

    if (this.errors.length > 0) {
      console.log('Errors:');
      this.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ❌ ${error}`);
      });
      console.log('');
    }

    if (this.warnings.length > 0) {
      console.log('Warnings:');
      this.warnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. ⚠️  ${warning}`);
      });
      console.log('');
    }

    console.log(`Total: ${this.errors.length} errors, ${this.warnings.length} warnings\n`);
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const filePath = process.argv[2];

  if (!filePath) {
    console.error('Usage: node validator.js <rule-file.yaml>');
    process.exit(1);
  }

  const validator = new RuleValidator();
  const result = await validator.validateFile(filePath);

  validator.printResults();

  process.exit(result.valid ? 0 : 1);
}

export default RuleValidator;

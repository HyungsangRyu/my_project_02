import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';

/**
 * Rule Engine - Loads, validates, and applies transformation rules
 */
export class RuleEngine {
  constructor() {
    this.rules = {
      layout: null,
      typography: null,
      colors: null,
      components: null,
      custom: {}
    };
    this.loaded = false;
  }

  /**
   * Load default rules from the defaults directory
   */
  async loadDefaultRules() {
    const rulesDir = path.join(process.cwd(), 'src', 'rules', 'defaults');

    try {
      // Load each default rule category
      const categories = ['layout', 'typography', 'colors', 'components'];

      for (const category of categories) {
        const rulePath = path.join(rulesDir, `${category}.yaml`);
        const content = await fs.readFile(rulePath, 'utf8');
        this.rules[category] = yaml.load(content);
      }

      this.loaded = true;
      console.log('✓ Default rules loaded successfully');
    } catch (error) {
      throw new Error(`Failed to load default rules: ${error.message}`);
    }
  }

  /**
   * Load custom rules from a YAML file
   * Custom rules will override or merge with default rules
   */
  async loadCustomRules(customRulePath) {
    try {
      const content = await fs.readFile(customRulePath, 'utf8');
      const customRules = yaml.load(content);

      // Merge custom rules with defaults
      this.mergeRules(customRules);

      console.log(`✓ Custom rules loaded from ${customRulePath}`);
      return customRules;
    } catch (error) {
      throw new Error(`Failed to load custom rules: ${error.message}`);
    }
  }

  /**
   * Merge custom rules with default rules (deep merge)
   */
  mergeRules(customRules) {
    // Store original custom rules
    this.rules.custom = customRules;

    // Merge each category
    if (customRules.layout) {
      this.rules.layout = this.deepMerge(this.rules.layout, customRules.layout);
    }

    if (customRules.typography) {
      this.rules.typography = this.deepMerge(this.rules.typography, customRules.typography);
    }

    if (customRules.colors) {
      this.rules.colors = this.deepMerge(this.rules.colors, customRules.colors);
    }

    if (customRules.components) {
      this.rules.components = this.deepMerge(this.rules.components, customRules.components);
    }
  }

  /**
   * Deep merge two objects
   */
  deepMerge(target, source) {
    const output = { ...target };

    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            output[key] = source[key];
          } else {
            output[key] = this.deepMerge(target[key], source[key]);
          }
        } else {
          output[key] = source[key];
        }
      });
    }

    return output;
  }

  /**
   * Check if value is an object
   */
  isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
  }

  /**
   * Get rule for a specific component type
   */
  getComponentRule(componentType) {
    if (!this.loaded) {
      throw new Error('Rules not loaded. Call loadDefaultRules() first.');
    }

    return this.rules.components?.[componentType] || null;
  }

  /**
   * Get layout rules
   */
  getLayoutRules() {
    if (!this.loaded) {
      throw new Error('Rules not loaded. Call loadDefaultRules() first.');
    }

    return this.rules.layout;
  }

  /**
   * Get typography rules
   */
  getTypographyRules() {
    if (!this.loaded) {
      throw new Error('Rules not loaded. Call loadDefaultRules() first.');
    }

    return this.rules.typography;
  }

  /**
   * Get color rules
   */
  getColorRules() {
    if (!this.loaded) {
      throw new Error('Rules not loaded. Call loadDefaultRules() first.');
    }

    return this.rules.colors;
  }

  /**
   * Map PPT color to HTML color using rules
   */
  mapColor(pptColor) {
    const colorRules = this.getColorRules();

    if (!colorRules || !colorRules.pptColorMapping) {
      return pptColor; // Return original if no mapping rules
    }

    // Check theme color mappings
    const mapping = colorRules.pptColorMapping.themeColors?.find(
      item => item.ppt === pptColor
    );

    if (mapping) {
      return mapping.html;
    }

    // If RGB format, convert to hex
    if (pptColor.startsWith('RGB')) {
      return this.rgbToHex(pptColor);
    }

    return pptColor;
  }

  /**
   * Convert RGB(r,g,b) to #hex
   */
  rgbToHex(rgbString) {
    const match = rgbString.match(/RGB\((\d+),\s*(\d+),\s*(\d+)\)/);

    if (!match) return rgbString;

    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);

    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }

  /**
   * Map PPT font to web font using rules
   */
  mapFont(pptFont) {
    const typographyRules = this.getTypographyRules();

    if (!typographyRules || !typographyRules.pptMapping) {
      return pptFont;
    }

    const mapping = typographyRules.pptMapping.fontMapping;
    return mapping?.[pptFont] || pptFont;
  }

  /**
   * Convert PPT font size (points) to rem
   */
  convertFontSize(pptSizePoints) {
    const typographyRules = this.getTypographyRules();

    if (!typographyRules?.pptMapping?.fontSizeConversion) {
      // Default conversion: 1rem = 16px, PPT uses points (1pt ≈ 1.333px)
      return `${(pptSizePoints * 1.333) / 16}rem`;
    }

    const conversion = typographyRules.pptMapping.fontSizeConversion;
    const basePPT = conversion.basePPTSize;
    const baseWeb = conversion.baseWebSize;

    // Calculate proportional size
    const baseWebNum = parseFloat(baseWeb);
    const remSize = (pptSizePoints / basePPT) * baseWebNum;

    // Clamp to min/max
    const minSize = parseFloat(conversion.minSize);
    const maxSize = parseFloat(conversion.maxSize);
    const clampedSize = Math.max(minSize, Math.min(maxSize, remSize));

    return `${clampedSize}rem`;
  }

  /**
   * Get all rules (for debugging or export)
   */
  getAllRules() {
    return this.rules;
  }

  /**
   * Validate rules structure
   */
  validateRules() {
    const required = ['layout', 'typography', 'colors', 'components'];
    const missing = required.filter(cat => !this.rules[cat]);

    if (missing.length > 0) {
      throw new Error(`Missing required rule categories: ${missing.join(', ')}`);
    }

    return true;
  }

  /**
   * Export merged rules to YAML file
   */
  async exportRules(outputPath) {
    try {
      const yamlContent = yaml.dump(this.rules, {
        indent: 2,
        lineWidth: 100,
        noRefs: true
      });

      await fs.writeFile(outputPath, yamlContent, 'utf8');
      console.log(`✓ Rules exported to ${outputPath}`);
    } catch (error) {
      throw new Error(`Failed to export rules: ${error.message}`);
    }
  }
}

export default RuleEngine;

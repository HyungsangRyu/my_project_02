import fs from 'fs/promises';
import path from 'path';
import Handlebars from 'handlebars';

/**
 * HTML Generator - Generates HTML from PPT data using templates and rules
 */
export class HtmlGenerator {
  constructor(ruleEngine) {
    this.ruleEngine = ruleEngine;
    this.templates = {};
    this.helpers = {};

    // Register default helpers
    this.registerDefaultHelpers();
  }

  /**
   * Load templates
   */
  async loadTemplates() {
    const templatesDir = path.join(process.cwd(), 'src', 'generators', 'templates');

    try {
      // Load base template
      const baseTemplate = await fs.readFile(
        path.join(templatesDir, 'base.hbs'),
        'utf8'
      );
      this.templates.base = Handlebars.compile(baseTemplate);

      // Load slide template
      const slideTemplate = await fs.readFile(
        path.join(templatesDir, 'slide.hbs'),
        'utf8'
      );
      this.templates.slide = Handlebars.compile(slideTemplate);

      console.log('✓ Templates loaded');
    } catch (error) {
      throw new Error(`Failed to load templates: ${error.message}`);
    }
  }

  /**
   * Register default Handlebars helpers
   */
  registerDefaultHelpers() {
    // Increment helper
    Handlebars.registerHelper('inc', (value) => {
      return parseInt(value) + 1;
    });

    // Repeat helper
    Handlebars.registerHelper('repeat', (n, block) => {
      let result = '';
      for (let i = 0; i < n; i++) {
        result += block.fn(i);
      }
      return result;
    });

    // Conditional equality
    Handlebars.registerHelper('eq', (a, b) => {
      return a === b;
    });

    // JSON stringify
    Handlebars.registerHelper('json', (context) => {
      return JSON.stringify(context, null, 2);
    });
  }

  /**
   * Generate HTML from PPT data
   */
  async generate(pptData, options = {}) {
    // Ensure templates are loaded
    if (!this.templates.base) {
      await this.loadTemplates();
    }

    // Generate CSS from rules
    const css = this.generateCSS();

    // Transform slides
    const slides = this.transformSlides(pptData.slides);

    // Prepare data for template
    const templateData = {
      title: pptData.metadata?.title || 'Presentation',
      author: pptData.metadata?.author || '',
      created: pptData.metadata?.created || '',
      totalSlides: pptData.totalSlides,
      slides: slides,
      css: css,
      options: options
    };

    // Generate HTML
    const html = this.templates.base(templateData);

    return html;
  }

  /**
   * Transform slides to HTML-ready data
   */
  transformSlides(slides) {
    return slides.map((slide, index) => {
      return {
        slideNumber: slide.slideNumber || index + 1,
        title: slide.title || '',
        content: this.transformContent(slide.content || []),
        backgroundColor: slide.backgroundColor || null
      };
    });
  }

  /**
   * Transform content items
   */
  transformContent(contents) {
    const transformed = [];

    for (const item of contents) {
      switch (item.type) {
        case 'text':
          transformed.push(this.transformText(item));
          break;

        case 'textBox':
          transformed.push(this.transformTextBox(item));
          break;

        case 'bulletList':
          transformed.push(this.transformBulletList(item));
          break;

        case 'numberedList':
          transformed.push(this.transformNumberedList(item));
          break;

        case 'table':
          transformed.push(this.transformTable(item));
          break;

        case 'image':
          transformed.push(this.transformImage(item));
          break;

        default:
          // Unknown type, wrap in div
          transformed.push({
            html: `<div class="unknown-type">${JSON.stringify(item)}</div>`
          });
      }
    }

    return transformed;
  }

  /**
   * Transform text
   */
  transformText(item) {
    const rule = this.ruleEngine.getComponentRule('textBox');
    const tag = rule?.tag || 'p';
    const className = rule?.className || '';

    return {
      html: `<${tag} class="${className}">${this.escapeHtml(item.text)}</${tag}>`
    };
  }

  /**
   * Transform text box
   */
  transformTextBox(item) {
    const rule = this.ruleEngine.getComponentRule('textBox');
    const tag = rule?.tag || 'div';
    const className = rule?.className || 'text-content';

    return {
      html: `<${tag} class="${className}">${this.escapeHtml(item.content)}</${tag}>`
    };
  }

  /**
   * Transform bullet list
   */
  transformBulletList(item) {
    const rule = this.ruleEngine.getComponentRule('bulletList');
    const tag = rule?.tag || 'ul';
    const className = rule?.className || 'bullet-list';
    const itemTag = rule?.itemTag || 'li';

    const items = Array.isArray(item.items) ? item.items : [item.text];
    const itemsHtml = items
      .map(text => `<${itemTag}>${this.escapeHtml(text)}</${itemTag}>`)
      .join('\n');

    return {
      html: `<${tag} class="${className}">\n${itemsHtml}\n</${tag}>`
    };
  }

  /**
   * Transform numbered list
   */
  transformNumberedList(item) {
    const rule = this.ruleEngine.getComponentRule('numberedList');
    const tag = rule?.tag || 'ol';
    const className = rule?.className || 'numbered-list';
    const itemTag = rule?.itemTag || 'li';

    const items = Array.isArray(item.items) ? item.items : [item.text];
    const itemsHtml = items
      .map(text => `<${itemTag}>${this.escapeHtml(text)}</${itemTag}>`)
      .join('\n');

    return {
      html: `<${tag} class="${className}">\n${itemsHtml}\n</${tag}>`
    };
  }

  /**
   * Transform table
   */
  transformTable(item) {
    const rule = this.ruleEngine.getComponentRule('table');
    const tableClass = rule?.tableClassName || 'data-table';
    const wrapperClass = rule?.className || 'table-wrapper';

    const headers = item.headers || [];
    const data = item.data || item.rows || [];

    let html = `<div class="${wrapperClass}">\n<table class="${tableClass}">\n`;

    // Headers
    if (headers.length > 0) {
      html += '<thead>\n<tr>\n';
      headers.forEach(header => {
        html += `<th>${this.escapeHtml(header)}</th>\n`;
      });
      html += '</tr>\n</thead>\n';
    }

    // Body
    html += '<tbody>\n';
    data.forEach(row => {
      html += '<tr>\n';
      row.forEach(cell => {
        html += `<td>${this.escapeHtml(cell)}</td>\n`;
      });
      html += '</tr>\n';
    });
    html += '</tbody>\n';

    html += '</table>\n</div>';

    return { html };
  }

  /**
   * Transform image
   */
  transformImage(item) {
    const rule = this.ruleEngine.getComponentRule('image');
    const tag = rule?.tag || 'figure';
    const className = rule?.className || 'slide-image';
    const alt = item.alt || rule?.altText?.template?.replace('{slideNumber}', item.slideNumber) || '';

    return {
      html: `<${tag} class="${className}">
  <img src="${item.src}" alt="${this.escapeHtml(alt)}" loading="lazy" />
  ${item.caption ? `<figcaption>${this.escapeHtml(item.caption)}</figcaption>` : ''}
</${tag}>`
    };
  }

  /**
   * Generate CSS from rules
   */
  generateCSS() {
    const layoutRules = this.ruleEngine.getLayoutRules();
    const typographyRules = this.ruleEngine.getTypographyRules();
    const colorRules = this.ruleEngine.getColorRules();

    let css = '/* Generated CSS from transformation rules */\n\n';

    // Reset & base styles
    css += `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: ${typographyRules.fonts?.primary || 'sans-serif'};
  font-size: ${typographyRules.body?.fontSize || '1rem'};
  line-height: ${typographyRules.body?.lineHeight || '1.6'};
  color: ${typographyRules.body?.color || '#333'};
  background-color: ${colorRules.base?.white || '#ffffff'};
}

`;

    // Container
    css += `.container {
  max-width: ${layoutRules.container?.maxWidth || '1200px'};
  margin: ${layoutRules.container?.margin || '0 auto'};
  padding: ${layoutRules.container?.padding || '2rem'};
}

`;

    // Slides
    css += `.slide {
  max-width: ${layoutRules.slide?.maxWidth || '1200px'};
  min-height: ${layoutRules.slide?.minHeight || '600px'};
  background-color: ${layoutRules.slide?.backgroundColor || '#ffffff'};
  border: ${layoutRules.slide?.border || '1px solid #e0e0e0'};
  border-radius: ${layoutRules.slide?.borderRadius || '8px'};
  box-shadow: ${layoutRules.slide?.boxShadow || '0 2px 8px rgba(0,0,0,0.1)'};
  margin: ${layoutRules.slide?.margin || '2rem auto'};
  padding: ${layoutRules.slide?.padding || '3rem'};
}

`;

    // Headings
    Object.entries(typographyRules.headings || {}).forEach(([level, styles]) => {
      css += `${level} {
  font-size: ${styles.fontSize};
  font-weight: ${styles.fontWeight};
  line-height: ${styles.lineHeight};
  margin-top: ${styles.marginTop};
  margin-bottom: ${styles.marginBottom};
  color: ${styles.color};
}

`;
    });

    // Lists
    css += `.bullet-list, .numbered-list {
  padding-left: ${typographyRules.lists?.bullet?.paddingLeft || '1.5rem'};
  margin-bottom: ${typographyRules.lists?.bullet?.marginBottom || '1rem'};
}

.bullet-list li, .numbered-list li {
  margin-bottom: ${typographyRules.lists?.item?.marginBottom || '0.5rem'};
  line-height: ${typographyRules.lists?.item?.lineHeight || '1.6'};
}

`;

    // Tables
    css += `.table-wrapper {
  overflow-x: auto;
  margin-bottom: 2rem;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.data-table th {
  background-color: #f9fafb;
  font-weight: 600;
}

`;

    // Responsive
    if (layoutRules.responsive?.enabled) {
      const breakpoints = layoutRules.breakpoints || {};

      css += `/* Responsive styles */
@media (max-width: ${breakpoints.tablet || '768px'}) {
  .container {
    padding: ${layoutRules.responsive.tablet?.containerPadding || '1.5rem'};
  }

  .slide {
    padding: ${layoutRules.responsive.tablet?.slidePadding || '2rem'};
  }
}

@media (max-width: ${breakpoints.mobile || '480px'}) {
  body {
    font-size: ${layoutRules.responsive.mobile?.fontSize || '0.9rem'};
  }

  .container {
    padding: ${layoutRules.responsive.mobile?.containerPadding || '1rem'};
  }

  .slide {
    padding: ${layoutRules.responsive.mobile?.slidePadding || '1.5rem'};
  }
}
`;
    }

    return css;
  }

  /**
   * Escape HTML special characters
   */
  escapeHtml(text) {
    if (typeof text !== 'string') return text;

    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };

    return text.replace(/[&<>"']/g, m => map[m]);
  }

  /**
   * Save HTML to file
   */
  async saveToFile(html, outputPath) {
    try {
      await fs.writeFile(outputPath, html, 'utf8');
      console.log(`✓ HTML saved to ${outputPath}`);
    } catch (error) {
      throw new Error(`Failed to save HTML: ${error.message}`);
    }
  }
}

export default HtmlGenerator;

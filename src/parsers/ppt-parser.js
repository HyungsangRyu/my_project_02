import fs from 'fs/promises';
import path from 'path';
import PizZip from 'pizzip';

/**
 * PPT Parser - Extracts content from PowerPoint files
 *
 * Note: This is a simplified parser. For production use, consider
 * using more robust libraries or external services.
 */
export class PPTParser {
  constructor() {
    this.slides = [];
    this.metadata = {};
  }

  /**
   * Parse a PPTX file
   */
  async parse(filePath) {
    try {
      // Read the PPTX file as a buffer
      const data = await fs.readFile(filePath);

      // PPTX is a ZIP archive
      const zip = new PizZip(data);

      // Extract metadata
      await this.extractMetadata(zip);

      // Extract slides
      await this.extractSlides(zip);

      console.log(`✓ Parsed ${this.slides.length} slides from ${path.basename(filePath)}`);

      return {
        metadata: this.metadata,
        slides: this.slides,
        totalSlides: this.slides.length
      };

    } catch (error) {
      throw new Error(`Failed to parse PPT file: ${error.message}`);
    }
  }

  /**
   * Extract metadata from the PPTX
   */
  async extractMetadata(zip) {
    try {
      // Try to read core.xml for metadata
      const coreXmlPath = 'docProps/core.xml';
      const coreXml = zip.file(coreXmlPath);

      if (coreXml) {
        const content = coreXml.asText();

        this.metadata = {
          title: this.extractXmlValue(content, 'dc:title'),
          author: this.extractXmlValue(content, 'dc:creator'),
          created: this.extractXmlValue(content, 'dcterms:created'),
          modified: this.extractXmlValue(content, 'dcterms:modified'),
          description: this.extractXmlValue(content, 'dc:description')
        };
      }
    } catch (error) {
      console.warn('Could not extract metadata:', error.message);
      this.metadata = {};
    }
  }

  /**
   * Extract slides from the PPTX
   */
  async extractSlides(zip) {
    this.slides = [];

    try {
      // Find all slide files (slide1.xml, slide2.xml, etc.)
      const slideFiles = Object.keys(zip.files)
        .filter(name => name.match(/ppt\/slides\/slide\d+\.xml$/))
        .sort((a, b) => {
          const numA = parseInt(a.match(/slide(\d+)\.xml$/)[1]);
          const numB = parseInt(b.match(/slide(\d+)\.xml$/)[1]);
          return numA - numB;
        });

      for (const slideFile of slideFiles) {
        const slideNumber = parseInt(slideFile.match(/slide(\d+)\.xml$/)[1]);
        const slideXml = zip.file(slideFile).asText();

        const slide = this.parseSlide(slideXml, slideNumber);
        this.slides.push(slide);
      }

    } catch (error) {
      console.warn('Error extracting slides:', error.message);
    }
  }

  /**
   * Parse a single slide XML
   */
  parseSlide(slideXml, slideNumber) {
    const slide = {
      slideNumber: slideNumber,
      title: '',
      content: [],
      layout: 'default',
      backgroundColor: null,
      notes: ''
    };

    // Extract text content (simplified - real parser would handle this better)
    const textMatches = slideXml.matchAll(/<a:t>([^<]+)<\/a:t>/g);

    for (const match of textMatches) {
      const text = match[1];

      // First text is usually the title
      if (!slide.title && text.trim().length > 0) {
        slide.title = text;
      } else if (text.trim().length > 0) {
        slide.content.push({
          type: 'text',
          text: text
        });
      }
    }

    // Extract shapes (simplified)
    if (slideXml.includes('<p:sp>')) {
      const shapes = this.extractShapes(slideXml);
      slide.content.push(...shapes);
    }

    // Extract tables (simplified)
    if (slideXml.includes('<a:tbl>')) {
      const tables = this.extractTables(slideXml);
      slide.content.push(...tables);
    }

    return slide;
  }

  /**
   * Extract shapes from slide XML
   */
  extractShapes(slideXml) {
    const shapes = [];

    // This is a simplified extraction
    // Real implementation would parse the XML properly

    const shapeMatches = slideXml.matchAll(/<p:sp>(.*?)<\/p:sp>/gs);

    for (const match of shapeMatches) {
      const shapeXml = match[1];

      // Extract text from shape
      const textMatches = shapeXml.matchAll(/<a:t>([^<]+)<\/a:t>/g);
      const texts = Array.from(textMatches).map(m => m[1]);

      if (texts.length > 0) {
        shapes.push({
          type: 'textBox',
          content: texts.join(' ')
        });
      }
    }

    return shapes;
  }

  /**
   * Extract tables from slide XML
   */
  extractTables(slideXml) {
    const tables = [];

    // This is a simplified extraction
    const tableMatches = slideXml.matchAll(/<a:tbl>(.*?)<\/a:tbl>/gs);

    for (const match of tableMatches) {
      const tableXml = match[1];

      // Extract rows
      const rowMatches = tableXml.matchAll(/<a:tr[^>]*>(.*?)<\/a:tr>/gs);
      const rows = [];

      for (const rowMatch of rowMatches) {
        const rowXml = rowMatch[1];
        const cellMatches = rowXml.matchAll(/<a:t>([^<]+)<\/a:t>/g);
        const cells = Array.from(cellMatches).map(m => m[1]);

        if (cells.length > 0) {
          rows.push(cells);
        }
      }

      if (rows.length > 0) {
        tables.push({
          type: 'table',
          rows: rows,
          headers: rows[0], // First row as headers
          data: rows.slice(1)
        });
      }
    }

    return tables;
  }

  /**
   * Extract value from XML
   */
  extractXmlValue(xml, tagName) {
    const regex = new RegExp(`<${tagName}[^>]*>([^<]+)<\/${tagName}>`, 'i');
    const match = xml.match(regex);
    return match ? match[1] : '';
  }

  /**
   * Get parsed data
   */
  getData() {
    return {
      metadata: this.metadata,
      slides: this.slides,
      totalSlides: this.slides.length
    };
  }

  /**
   * Export to JSON
   */
  async exportToJson(outputPath) {
    const data = this.getData();

    try {
      await fs.writeFile(outputPath, JSON.stringify(data, null, 2), 'utf8');
      console.log(`✓ Exported parsed data to ${outputPath}`);
    } catch (error) {
      throw new Error(`Failed to export data: ${error.message}`);
    }
  }
}

export default PPTParser;

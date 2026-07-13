/**
 * Content Extractor - Advanced content extraction and classification
 */
export class ContentExtractor {
  constructor() {
    this.patterns = {
      bulletPoint: /^[•‣◦⁃∙\-\*]\s*/,
      numberedList: /^\d+[\.\)]\s*/,
      heading: /^(#{1,6})\s+/,
      url: /https?:\/\/[^\s]+/g,
      email: /[\w.-]+@[\w.-]+\.\w+/g
    };
  }

  /**
   * Classify content type
   */
  classifyContent(text) {
    // Check for bullet points
    if (this.patterns.bulletPoint.test(text)) {
      return {
        type: 'bulletList',
        text: text.replace(this.patterns.bulletPoint, '').trim()
      };
    }

    // Check for numbered lists
    if (this.patterns.numberedList.test(text)) {
      return {
        type: 'numberedList',
        text: text.replace(this.patterns.numberedList, '').trim()
      };
    }

    // Check for headings (markdown-style)
    const headingMatch = text.match(this.patterns.heading);
    if (headingMatch) {
      return {
        type: 'heading',
        level: headingMatch[1].length,
        text: text.replace(this.patterns.heading, '').trim()
      };
    }

    // Check if it's a title (heuristic: short, all caps or title case)
    if (text.length < 100 && (this.isAllCaps(text) || this.isTitleCase(text))) {
      return {
        type: 'title',
        text: text
      };
    }

    // Default to paragraph
    return {
      type: 'paragraph',
      text: text
    };
  }

  /**
   * Extract lists from content
   */
  extractLists(contents) {
    const lists = [];
    let currentList = null;

    for (const content of contents) {
      if (content.type === 'text') {
        const classified = this.classifyContent(content.text);

        if (classified.type === 'bulletList' || classified.type === 'numberedList') {
          // Continue or start new list
          if (currentList && currentList.type === classified.type) {
            currentList.items.push(classified.text);
          } else {
            // Start new list
            if (currentList) {
              lists.push(currentList);
            }

            currentList = {
              type: classified.type,
              items: [classified.text]
            };
          }
        } else {
          // Not a list item
          if (currentList) {
            lists.push(currentList);
            currentList = null;
          }

          lists.push(classified);
        }
      } else {
        // Other content type
        if (currentList) {
          lists.push(currentList);
          currentList = null;
        }

        lists.push(content);
      }
    }

    // Push final list if exists
    if (currentList) {
      lists.push(currentList);
    }

    return lists;
  }

  /**
   * Extract links from text
   */
  extractLinks(text) {
    const urls = text.match(this.patterns.url) || [];
    const emails = text.match(this.patterns.email) || [];

    return {
      urls: urls,
      emails: emails
    };
  }

  /**
   * Clean text
   */
  cleanText(text) {
    return text
      .trim()
      .replace(/\s+/g, ' ')  // Normalize whitespace
      .replace(/ /g, ' ');  // Replace non-breaking spaces
  }

  /**
   * Check if text is all caps
   */
  isAllCaps(text) {
    const letters = text.replace(/[^a-zA-Z]/g, '');
    return letters.length > 0 && letters === letters.toUpperCase();
  }

  /**
   * Check if text is title case
   */
  isTitleCase(text) {
    const words = text.split(/\s+/);

    if (words.length === 0) return false;

    // Check if most words start with capital letter
    const capitalizedWords = words.filter(word => {
      return word.length > 0 && word[0] === word[0].toUpperCase();
    });

    return capitalizedWords.length / words.length > 0.5;
  }

  /**
   * Extract formatting
   */
  extractFormatting(xmlNode) {
    const formatting = {
      bold: false,
      italic: false,
      underline: false,
      fontSize: null,
      fontFamily: null,
      color: null
    };

    // Check for bold
    if (xmlNode.includes('<a:b val="1"/>') || xmlNode.includes('<b>')) {
      formatting.bold = true;
    }

    // Check for italic
    if (xmlNode.includes('<a:i val="1"/>') || xmlNode.includes('<i>')) {
      formatting.italic = true;
    }

    // Check for underline
    if (xmlNode.includes('<a:u ') || xmlNode.includes('<u>')) {
      formatting.underline = true;
    }

    // Extract font size
    const sizeMatch = xmlNode.match(/sz="(\d+)"/);
    if (sizeMatch) {
      formatting.fontSize = parseInt(sizeMatch[1]) / 100; // PPT uses 1/100 point units
    }

    // Extract font family
    const fontMatch = xmlNode.match(/typeface="([^"]+)"/);
    if (fontMatch) {
      formatting.fontFamily = fontMatch[1];
    }

    // Extract color (simplified)
    const colorMatch = xmlNode.match(/val="([0-9A-Fa-f]{6})"/);
    if (colorMatch) {
      formatting.color = `#${colorMatch[1]}`;
    }

    return formatting;
  }

  /**
   * Group related content
   */
  groupContent(contents) {
    const groups = [];
    let currentGroup = null;

    for (const content of contents) {
      // Group headings with following content
      if (content.type === 'heading' || content.type === 'title') {
        if (currentGroup) {
          groups.push(currentGroup);
        }

        currentGroup = {
          heading: content.text,
          level: content.level || 1,
          content: []
        };
      } else if (currentGroup) {
        currentGroup.content.push(content);
      } else {
        // No current group, create standalone group
        groups.push({
          heading: null,
          content: [content]
        });
      }
    }

    // Push final group
    if (currentGroup) {
      groups.push(currentGroup);
    }

    return groups;
  }
}

export default ContentExtractor;

import fs from 'fs/promises';
import path from 'path';

/**
 * File handling utilities
 */
export class FileHandler {
  /**
   * Ensure directory exists
   */
  static async ensureDir(dirPath) {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  /**
   * Check if file exists
   */
  static async exists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Read JSON file
   */
  static async readJson(filePath) {
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
  }

  /**
   * Write JSON file
   */
  static async writeJson(filePath, data) {
    const content = JSON.stringify(data, null, 2);
    await fs.writeFile(filePath, content, 'utf8');
  }

  /**
   * Get file extension
   */
  static getExtension(filePath) {
    return path.extname(filePath).toLowerCase();
  }

  /**
   * Get filename without extension
   */
  static getBasename(filePath) {
    return path.basename(filePath, path.extname(filePath));
  }

  /**
   * Generate output filename
   */
  static generateOutputFilename(inputPath, suffix = '', extension = '.html') {
    const basename = this.getBasename(inputPath);
    return `${basename}${suffix}${extension}`;
  }
}

export default FileHandler;

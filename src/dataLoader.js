/**
 * DataLoader - Loads and parses slang data from product.md
 * Converts markdown format into structured SlangTerm objects
 */

const fs = require('fs');
const path = require('path');
const { validateSlangTerm } = require('./validation');

/**
 * Parses a markdown file containing slang terms
 * Expected format:
 * ## Term Name
 * Definition: [definition text]
 * Formal Translation: [translation] (optional)
 * Usage Examples:
 * - [example 1]
 * - [example 2]
 * Cultural Context:
 * - Age Group: [age group]
 * - Social Setting: [setting]
 * - Region Specificity: [specificity]
 * - Additional Notes: [notes] (optional)
 *
 * @param {string} filePath - Path to the product.md file
 * @returns {Object} { terms: SlangTerm[], errors: string[] }
 */
function parseProductMarkdown(filePath) {
  const terms = [];
  const errors = [];

  try {
    // Read the file
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    let currentTerm = null;
    let currentSection = null;
    let termIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // Skip empty lines and comments
      if (!trimmedLine || trimmedLine.startsWith('<!--')) {
        continue;
      }

      // Detect term header (## Term Name)
      if (trimmedLine.startsWith('## ')) {
        // Save previous term if exists
        if (currentTerm) {
          const validation = validateSlangTerm(currentTerm);
          if (validation.isValid) {
            terms.push(currentTerm);
          } else {
            errors.push(`Term "${currentTerm.term}": ${validation.errors.join(', ')}`);
          }
        }

        // Start new term
        const termName = trimmedLine.substring(3).trim();
        termIndex++;
        currentTerm = {
          id: `term-${termIndex}`,
          term: termName,
          definition: '',
          usageExamples: [],
          culturalContext: {
            ageGroup: '',
            socialSetting: '',
            regionSpecificity: '',
            additionalNotes: ''
          }
        };
        currentSection = null;
        continue;
      }

      // Skip if no current term
      if (!currentTerm) {
        continue;
      }

      // Parse Definition
      if (trimmedLine.startsWith('Definition:')) {
        currentTerm.definition = trimmedLine.substring('Definition:'.length).trim();
        currentSection = null;
        continue;
      }

      // Parse Formal Translation
      if (trimmedLine.startsWith('Formal Translation:')) {
        currentTerm.formalTranslation = trimmedLine.substring('Formal Translation:'.length).trim();
        currentSection = null;
        continue;
      }

      // Detect Usage Examples section
      if (trimmedLine === 'Usage Examples:') {
        currentSection = 'usageExamples';
        continue;
      }

      // Detect Cultural Context section
      if (trimmedLine === 'Cultural Context:') {
        currentSection = 'culturalContext';
        continue;
      }

      // Parse usage examples (bullet points)
      if (currentSection === 'usageExamples' && trimmedLine.startsWith('- ')) {
        const example = trimmedLine.substring(2).trim();
        if (example) {
          currentTerm.usageExamples.push({
            example: example,
            context: ''
          });
        }
        continue;
      }

      // Parse cultural context fields
      if (currentSection === 'culturalContext') {
        if (trimmedLine.startsWith('- Age Group:')) {
          currentTerm.culturalContext.ageGroup = trimmedLine.substring('- Age Group:'.length).trim();
        } else if (trimmedLine.startsWith('- Social Setting:')) {
          currentTerm.culturalContext.socialSetting = trimmedLine.substring('- Social Setting:'.length).trim();
        } else if (trimmedLine.startsWith('- Region Specificity:')) {
          currentTerm.culturalContext.regionSpecificity = trimmedLine.substring('- Region Specificity:'.length).trim();
        } else if (trimmedLine.startsWith('- Additional Notes:')) {
          currentTerm.culturalContext.additionalNotes = trimmedLine.substring('- Additional Notes:'.length).trim();
        }
        continue;
      }
    }

    // Save last term if exists
    if (currentTerm) {
      const validation = validateSlangTerm(currentTerm);
      if (validation.isValid) {
        terms.push(currentTerm);
      } else {
        errors.push(`Term "${currentTerm.term}": ${validation.errors.join(', ')}`);
      }
    }
  } catch (error) {
    errors.push(`Error reading file: ${error.message}`);
  }

  return { terms, errors };
}

/**
 * Loads the slang database from product.md
 * @param {string} [filePath] - Path to product.md (defaults to data/product.md)
 * @returns {Object} { database: SlangTerm[], errors: string[] }
 */
function loadDatabase(filePath = path.join(__dirname, '../data/product.md')) {
  return parseProductMarkdown(filePath);
}

module.exports = {
  parseProductMarkdown,
  loadDatabase
};

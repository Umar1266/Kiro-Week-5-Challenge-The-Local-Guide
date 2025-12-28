const { parseProductMarkdown, loadDatabase } = require('../src/dataLoader');
const fs = require('fs');
const path = require('path');
const os = require('os');
const fc = require('fast-check');

describe('DataLoader', () => {
  let tempDir;

  beforeEach(() => {
    // Create a temporary directory for test files
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dataloader-test-'));
  });

  afterEach(() => {
    // Clean up temporary files
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
  });

  describe('parseProductMarkdown', () => {
    test('should parse valid product.md with single term', () => {
      const testFile = path.join(tempDir, 'test.md');
      const content = `## lit
Definition: Exciting or excellent
Formal Translation: Amazing
Usage Examples:
- That party was lit!
- Your outfit is lit!
Cultural Context:
- Age Group: teens
- Social Setting: casual
- Region Specificity: city-wide
- Additional Notes: Popular in urban areas`;

      fs.writeFileSync(testFile, content);
      const result = parseProductMarkdown(testFile);

      expect(result.terms).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
      expect(result.terms[0].term).toBe('lit');
      expect(result.terms[0].definition).toBe('Exciting or excellent');
      expect(result.terms[0].formalTranslation).toBe('Amazing');
      expect(result.terms[0].usageExamples).toHaveLength(2);
      expect(result.terms[0].culturalContext.ageGroup).toBe('teens');
    });

    test('should parse multiple terms from product.md', () => {
      const testFile = path.join(tempDir, 'test.md');
      const content = `## lit
Definition: Exciting or excellent
Usage Examples:
- That party was lit!
Cultural Context:
- Age Group: teens
- Social Setting: casual
- Region Specificity: city-wide

## salty
Definition: Bitter or upset
Usage Examples:
- Don't be salty
Cultural Context:
- Age Group: young adults
- Social Setting: casual
- Region Specificity: city-wide`;

      fs.writeFileSync(testFile, content);
      const result = parseProductMarkdown(testFile);

      expect(result.terms).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
      expect(result.terms[0].term).toBe('lit');
      expect(result.terms[1].term).toBe('salty');
    });

    test('should skip terms with missing required fields', () => {
      const testFile = path.join(tempDir, 'test.md');
      const content = `## lit
Definition: Exciting or excellent
Usage Examples:
- That party was lit!
Cultural Context:
- Age Group: teens
- Social Setting: casual
- Region Specificity: city-wide

## incomplete
Definition: Missing examples
Cultural Context:
- Age Group: teens
- Social Setting: casual
- Region Specificity: city-wide`;

      fs.writeFileSync(testFile, content);
      const result = parseProductMarkdown(testFile);

      expect(result.terms).toHaveLength(1);
      expect(result.terms[0].term).toBe('lit');
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('incomplete');
    });

    test('should handle missing definition', () => {
      const testFile = path.join(tempDir, 'test.md');
      const content = `## lit
Usage Examples:
- That party was lit!
Cultural Context:
- Age Group: teens
- Social Setting: casual
- Region Specificity: city-wide`;

      fs.writeFileSync(testFile, content);
      const result = parseProductMarkdown(testFile);

      expect(result.terms).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
    });

    test('should handle missing usage examples', () => {
      const testFile = path.join(tempDir, 'test.md');
      const content = `## lit
Definition: Exciting or excellent
Cultural Context:
- Age Group: teens
- Social Setting: casual
- Region Specificity: city-wide`;

      fs.writeFileSync(testFile, content);
      const result = parseProductMarkdown(testFile);

      expect(result.terms).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
    });

    test('should handle missing cultural context fields', () => {
      const testFile = path.join(tempDir, 'test.md');
      const content = `## lit
Definition: Exciting or excellent
Usage Examples:
- That party was lit!
Cultural Context:
- Age Group: teens`;

      fs.writeFileSync(testFile, content);
      const result = parseProductMarkdown(testFile);

      expect(result.terms).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
    });

    test('should handle file not found error', () => {
      const result = parseProductMarkdown('/nonexistent/path/file.md');

      expect(result.terms).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Error reading file');
    });

    test('should skip empty lines and comments', () => {
      const testFile = path.join(tempDir, 'test.md');
      const content = `<!-- This is a comment -->

## lit
Definition: Exciting or excellent

Usage Examples:
- That party was lit!

Cultural Context:
- Age Group: teens
- Social Setting: casual
- Region Specificity: city-wide`;

      fs.writeFileSync(testFile, content);
      const result = parseProductMarkdown(testFile);

      expect(result.terms).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
    });

    test('should handle optional formal translation', () => {
      const testFile = path.join(tempDir, 'test.md');
      const content = `## lit
Definition: Exciting or excellent
Usage Examples:
- That party was lit!
Cultural Context:
- Age Group: teens
- Social Setting: casual
- Region Specificity: city-wide`;

      fs.writeFileSync(testFile, content);
      const result = parseProductMarkdown(testFile);

      expect(result.terms).toHaveLength(1);
      expect(result.terms[0].formalTranslation).toBeUndefined();
    });

    test('should assign unique IDs to terms', () => {
      const testFile = path.join(tempDir, 'test.md');
      const content = `## lit
Definition: Exciting or excellent
Usage Examples:
- That party was lit!
Cultural Context:
- Age Group: teens
- Social Setting: casual
- Region Specificity: city-wide

## salty
Definition: Bitter or upset
Usage Examples:
- Don't be salty
Cultural Context:
- Age Group: young adults
- Social Setting: casual
- Region Specificity: city-wide`;

      fs.writeFileSync(testFile, content);
      const result = parseProductMarkdown(testFile);

      expect(result.terms[0].id).toBe('term-1');
      expect(result.terms[1].id).toBe('term-2');
    });
  });

  describe('loadDatabase', () => {
    test('should load database from default path', () => {
      // This test uses the actual data/product.md file
      const result = loadDatabase(path.join(__dirname, '../data/product.md'));

      expect(result.terms.length).toBeGreaterThan(0);
      expect(Array.isArray(result.terms)).toBe(true);
      expect(Array.isArray(result.errors)).toBe(true);
    });

    test('should load database from custom path', () => {
      const testFile = path.join(tempDir, 'custom.md');
      const content = `## test
Definition: A test term
Usage Examples:
- This is a test
Cultural Context:
- Age Group: all ages
- Social Setting: casual
- Region Specificity: city-wide`;

      fs.writeFileSync(testFile, content);
      const result = loadDatabase(testFile);

      expect(result.terms).toHaveLength(1);
      expect(result.terms[0].term).toBe('test');
    });
  });

  describe('Property 4: Database Consistency', () => {
    // Property: For any slang term loaded from product.md, all required fields 
    // (term, definition, at least one usage example, and cultural context) 
    // must be present and non-empty.
    // **Validates: Requirements 6.3, 6.4**
    test('should ensure all loaded terms have required fields present and non-empty', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              term: fc.stringMatching(/^[a-z]+$/),
              definition: fc.stringMatching(/^[a-z\s]+$/),
              ageGroup: fc.stringMatching(/^[a-z\s]+$/),
              socialSetting: fc.stringMatching(/^[a-z\s]+$/),
              regionSpecificity: fc.stringMatching(/^[a-z\s]+$/)
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (generatedTerms) => {
            // Build markdown content from generated terms
            let markdownContent = '';
            generatedTerms.forEach((term) => {
              markdownContent += `## ${term.term}\n`;
              markdownContent += `Definition: ${term.definition}\n`;
              markdownContent += `Usage Examples:\n`;
              markdownContent += `- Example of ${term.term}\n`;
              markdownContent += `Cultural Context:\n`;
              markdownContent += `- Age Group: ${term.ageGroup}\n`;
              markdownContent += `- Social Setting: ${term.socialSetting}\n`;
              markdownContent += `- Region Specificity: ${term.regionSpecificity}\n\n`;
            });

            // Write to temporary file
            const testFile = path.join(tempDir, `property-test-${Date.now()}.md`);
            fs.writeFileSync(testFile, markdownContent);

            // Parse the file
            const result = parseProductMarkdown(testFile);

            // Clean up
            fs.unlinkSync(testFile);

            // Property: All loaded terms must have required fields present and non-empty
            result.terms.forEach((loadedTerm) => {
              // Check that term field is present and non-empty
              expect(loadedTerm.term).toBeDefined();
              expect(typeof loadedTerm.term).toBe('string');
              expect(loadedTerm.term.trim().length).toBeGreaterThan(0);

              // Check that definition field is present and non-empty
              expect(loadedTerm.definition).toBeDefined();
              expect(typeof loadedTerm.definition).toBe('string');
              expect(loadedTerm.definition.trim().length).toBeGreaterThan(0);

              // Check that at least one usage example is present
              expect(loadedTerm.usageExamples).toBeDefined();
              expect(Array.isArray(loadedTerm.usageExamples)).toBe(true);
              expect(loadedTerm.usageExamples.length).toBeGreaterThan(0);

              // Check that each usage example has non-empty example field
              loadedTerm.usageExamples.forEach((example) => {
                expect(example.example).toBeDefined();
                expect(typeof example.example).toBe('string');
                expect(example.example.trim().length).toBeGreaterThan(0);
              });

              // Check that cultural context is present with all required fields
              expect(loadedTerm.culturalContext).toBeDefined();
              expect(typeof loadedTerm.culturalContext).toBe('object');

              expect(loadedTerm.culturalContext.ageGroup).toBeDefined();
              expect(typeof loadedTerm.culturalContext.ageGroup).toBe('string');
              expect(loadedTerm.culturalContext.ageGroup.trim().length).toBeGreaterThan(0);

              expect(loadedTerm.culturalContext.socialSetting).toBeDefined();
              expect(typeof loadedTerm.culturalContext.socialSetting).toBe('string');
              expect(loadedTerm.culturalContext.socialSetting.trim().length).toBeGreaterThan(0);

              expect(loadedTerm.culturalContext.regionSpecificity).toBeDefined();
              expect(typeof loadedTerm.culturalContext.regionSpecificity).toBe('string');
              expect(loadedTerm.culturalContext.regionSpecificity.trim().length).toBeGreaterThan(0);
            });

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
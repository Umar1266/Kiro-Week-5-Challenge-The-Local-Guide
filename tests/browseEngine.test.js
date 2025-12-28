const { browse, paginate, getTermCount } = require('../src/browseEngine');
const fc = require('fast-check');

describe('BrowseEngine', () => {
  // Sample database for testing
  const sampleDatabase = [
    {
      id: 'term-1',
      term: 'lit',
      definition: 'Exciting or excellent',
      formalTranslation: 'Amazing',
      usageExamples: [
        { example: 'That party was lit!' },
        { example: 'Your outfit is lit!' }
      ],
      culturalContext: {
        ageGroup: 'teens',
        socialSetting: 'casual',
        regionSpecificity: 'city-wide',
        additionalNotes: 'Popular in urban areas'
      }
    },
    {
      id: 'term-2',
      term: 'salty',
      definition: 'Bitter or upset about something',
      formalTranslation: 'Upset',
      usageExamples: [
        { example: 'Don\'t be salty about losing the game' },
        { example: 'She\'s salty because she didn\'t get invited' }
      ],
      culturalContext: {
        ageGroup: 'young adults',
        socialSetting: 'casual',
        regionSpecificity: 'city-wide'
      }
    },
    {
      id: 'term-3',
      term: 'flex',
      definition: 'To show off or boast',
      formalTranslation: 'Show off',
      usageExamples: [
        { example: 'Stop flexing your new car' },
        { example: 'He\'s always flexing his wealth' }
      ],
      culturalContext: {
        ageGroup: 'teens',
        socialSetting: 'street',
        regionSpecificity: 'neighborhood',
        additionalNotes: 'Often used in hip-hop culture'
      }
    },
    {
      id: 'term-4',
      term: 'vibe',
      definition: 'A feeling or atmosphere',
      formalTranslation: 'Feeling',
      usageExamples: [
        { example: 'I\'m getting good vibes from this place' },
        { example: 'The vibe at the party was amazing' }
      ],
      culturalContext: {
        ageGroup: 'all ages',
        socialSetting: 'casual',
        regionSpecificity: 'city-wide'
      }
    },
    {
      id: 'term-5',
      term: 'based',
      definition: 'Authentic or true to oneself',
      formalTranslation: 'Authentic',
      usageExamples: [
        { example: 'That\'s a based opinion' },
        { example: 'He\'s based and doesn\'t care what others think' }
      ],
      culturalContext: {
        ageGroup: 'teens',
        socialSetting: 'casual',
        regionSpecificity: 'city-wide'
      }
    }
  ];

  describe('Browse Function', () => {
    test('should return all terms from database', () => {
      const result = browse(sampleDatabase);
      expect(result).toHaveLength(sampleDatabase.length);
    });

    test('should sort terms alphabetically', () => {
      const result = browse(sampleDatabase);
      const terms = result.map(t => t.term);
      expect(terms).toEqual(['based', 'flex', 'lit', 'salty', 'vibe']);
    });

    test('should handle case-insensitive sorting', () => {
      const mixedCaseDb = [
        { ...sampleDatabase[0], term: 'LIT' },
        { ...sampleDatabase[1], term: 'salty' },
        { ...sampleDatabase[2], term: 'FLEX' }
      ];
      const result = browse(mixedCaseDb);
      const terms = result.map(t => t.term.toLowerCase());
      expect(terms).toEqual(['flex', 'lit', 'salty']);
    });

    test('should not modify original database', () => {
      const originalOrder = sampleDatabase.map(t => t.term);
      browse(sampleDatabase);
      const currentOrder = sampleDatabase.map(t => t.term);
      expect(currentOrder).toEqual(originalOrder);
    });

    test('should handle empty database', () => {
      const result = browse([]);
      expect(result).toHaveLength(0);
    });

    test('should handle null database', () => {
      const result = browse(null);
      expect(result).toHaveLength(0);
    });

    test('should handle undefined database', () => {
      const result = browse(undefined);
      expect(result).toHaveLength(0);
    });

    test('should handle single term', () => {
      const result = browse([sampleDatabase[0]]);
      expect(result).toHaveLength(1);
      expect(result[0].term).toBe('lit');
    });

    test('should preserve all term properties after sorting', () => {
      const result = browse(sampleDatabase);
      const firstTerm = result[0];
      expect(firstTerm).toHaveProperty('id');
      expect(firstTerm).toHaveProperty('term');
      expect(firstTerm).toHaveProperty('definition');
      expect(firstTerm).toHaveProperty('usageExamples');
      expect(firstTerm).toHaveProperty('culturalContext');
    });
  });

  describe('Paginate Function', () => {
    test('should return paginated results with default parameters', () => {
      const result = paginate(sampleDatabase);
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('limit');
      expect(result).toHaveProperty('totalItems');
      expect(result).toHaveProperty('totalPages');
      expect(result).toHaveProperty('items');
    });

    test('should return correct page 1 with limit 2', () => {
      const result = paginate(sampleDatabase, 1, 2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(2);
      expect(result.items).toHaveLength(2);
      expect(result.items[0].term).toBe('based');
      expect(result.items[1].term).toBe('flex');
    });

    test('should return correct page 2 with limit 2', () => {
      const result = paginate(sampleDatabase, 2, 2);
      expect(result.page).toBe(2);
      expect(result.items).toHaveLength(2);
      expect(result.items[0].term).toBe('lit');
      expect(result.items[1].term).toBe('salty');
    });

    test('should return correct page 3 with limit 2', () => {
      const result = paginate(sampleDatabase, 3, 2);
      expect(result.page).toBe(3);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].term).toBe('vibe');
    });

    test('should calculate total pages correctly', () => {
      const result = paginate(sampleDatabase, 1, 2);
      expect(result.totalPages).toBe(3);
    });

    test('should calculate total items correctly', () => {
      const result = paginate(sampleDatabase, 1, 2);
      expect(result.totalItems).toBe(5);
    });

    test('should handle page beyond total pages', () => {
      const result = paginate(sampleDatabase, 10, 2);
      expect(result.page).toBe(3);
      expect(result.items).toHaveLength(1);
    });

    test('should handle page 0 as page 1', () => {
      const result = paginate(sampleDatabase, 0, 2);
      expect(result.page).toBe(1);
      expect(result.items).toHaveLength(2);
    });

    test('should handle negative page as page 1', () => {
      const result = paginate(sampleDatabase, -5, 2);
      expect(result.page).toBe(1);
      expect(result.items).toHaveLength(2);
    });

    test('should handle limit 0 as limit 1', () => {
      const result = paginate(sampleDatabase, 1, 0);
      expect(result.limit).toBe(1);
      expect(result.items).toHaveLength(1);
    });

    test('should handle negative limit as limit 1', () => {
      const result = paginate(sampleDatabase, 1, -5);
      expect(result.limit).toBe(1);
      expect(result.items).toHaveLength(1);
    });

    test('should handle limit larger than database', () => {
      const result = paginate(sampleDatabase, 1, 100);
      expect(result.items).toHaveLength(5);
      expect(result.totalPages).toBe(1);
    });

    test('should handle empty database', () => {
      const result = paginate([], 1, 10);
      expect(result.totalItems).toBe(0);
      expect(result.totalPages).toBe(0);
      expect(result.items).toHaveLength(0);
    });

    test('should handle null database', () => {
      const result = paginate(null, 1, 10);
      expect(result.totalItems).toBe(0);
      expect(result.totalPages).toBe(0);
      expect(result.items).toHaveLength(0);
    });

    test('should return items in alphabetical order', () => {
      const result = paginate(sampleDatabase, 1, 10);
      const terms = result.items.map(t => t.term);
      expect(terms).toEqual(['based', 'flex', 'lit', 'salty', 'vibe']);
    });

    test('should handle float page number', () => {
      const result = paginate(sampleDatabase, 1.7, 2);
      expect(result.page).toBe(1);
      expect(result.items).toHaveLength(2);
    });

    test('should handle float limit number', () => {
      const result = paginate(sampleDatabase, 1, 2.7);
      expect(result.limit).toBe(2);
      expect(result.items).toHaveLength(2);
    });
  });

  describe('Term Count Function', () => {
    test('should return correct count for sample database', () => {
      const count = getTermCount(sampleDatabase);
      expect(count).toBe(5);
    });

    test('should return 0 for empty database', () => {
      const count = getTermCount([]);
      expect(count).toBe(0);
    });

    test('should return 0 for null database', () => {
      const count = getTermCount(null);
      expect(count).toBe(0);
    });

    test('should return 0 for undefined database', () => {
      const count = getTermCount(undefined);
      expect(count).toBe(0);
    });

    test('should return 1 for single term', () => {
      const count = getTermCount([sampleDatabase[0]]);
      expect(count).toBe(1);
    });

    test('should return correct count for large database', () => {
      const largeDb = Array.from({ length: 1000 }, (_, i) => ({
        id: `term-${i}`,
        term: `term${i}`,
        definition: 'test',
        usageExamples: [{ example: 'test' }],
        culturalContext: {
          ageGroup: 'all',
          socialSetting: 'casual',
          regionSpecificity: 'city-wide'
        }
      }));
      const count = getTermCount(largeDb);
      expect(count).toBe(1000);
    });
  });

  describe('Property-Based Tests', () => {
    // Property 6: Browse Alphabetical Ordering
    // For any browse operation, the returned list should be sorted alphabetically
    test('Property 6: Browse alphabetical ordering - terms are sorted alphabetically', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.string(),
              term: fc.stringMatching(/^[a-z]+$/),
              definition: fc.string(),
              usageExamples: fc.constant([{ example: 'test' }]),
              culturalContext: fc.constant({
                ageGroup: 'all',
                socialSetting: 'casual',
                regionSpecificity: 'city-wide'
              })
            }),
            { minLength: 1, maxLength: 100 }
          ),
          (database) => {
            const result = browse(database);

            // Check that results are sorted alphabetically
            for (let i = 1; i < result.length; i++) {
              const prevTerm = result[i - 1].term.toLowerCase();
              const currentTerm = result[i].term.toLowerCase();
              if (prevTerm.localeCompare(currentTerm) > 0) {
                return false;
              }
            }
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    // Property 8: Term Count Accuracy
    // For any browse or pagination operation, the returned term count should match the array length
    test('Property 8: Term count accuracy - count matches items array length', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.string(),
              term: fc.stringMatching(/^[a-z]+$/),
              definition: fc.string(),
              usageExamples: fc.constant([{ example: 'test' }]),
              culturalContext: fc.constant({
                ageGroup: 'all',
                socialSetting: 'casual',
                regionSpecificity: 'city-wide'
              })
            }),
            { minLength: 0, maxLength: 100 }
          ),
          (database) => {
            const count = getTermCount(database);
            return count === database.length;
          }
        ),
        { numRuns: 100 }
      );
    });

    // Additional property test for pagination consistency
    test('Property: Pagination consistency - all items across pages equal total items', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.string(),
              term: fc.stringMatching(/^[a-z]+$/),
              definition: fc.string(),
              usageExamples: fc.constant([{ example: 'test' }]),
              culturalContext: fc.constant({
                ageGroup: 'all',
                socialSetting: 'casual',
                regionSpecificity: 'city-wide'
              })
            }),
            { minLength: 0, maxLength: 100 }
          ),
          fc.integer({ min: 1, max: 20 }),
          (database, limit) => {
            let allItems = [];
            let page = 1;

            while (true) {
              const result = paginate(database, page, limit);
              allItems = allItems.concat(result.items);

              if (page >= result.totalPages) {
                break;
              }
              page++;
            }

            // Total items collected should equal database length
            return allItems.length === database.length;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

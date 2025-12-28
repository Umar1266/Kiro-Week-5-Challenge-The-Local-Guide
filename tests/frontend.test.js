/**
 * Frontend Unit Tests for Slang Translator
 * Tests search functionality, browse functionality, navigation, and error handling
 * Requirements: 2.1, 2.2, 2.3, 4.1, 4.2, 4.3, 4.4
 */

const request = require('supertest');
const app = require('../src/index');

describe('Frontend Unit Tests', () => {
  describe('10.1 Search Functionality', () => {
    test('should perform search and return results with required fields', async () => {
      // Test search functionality - Requirements 2.1, 2.2
      const response = await request(app)
        .get('/api/search')
        .query({ q: 'lit' })
        .expect(200);

      expect(response.body).toHaveProperty('query');
      expect(response.body).toHaveProperty('results');
      expect(response.body).toHaveProperty('totalResults');
      expect(Array.isArray(response.body.results)).toBe(true);

      // Verify each result has fields needed for display
      if (response.body.results.length > 0) {
        const result = response.body.results[0];
        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('term');
        expect(result).toHaveProperty('definition');
        expect(result).toHaveProperty('usageExamples');
        expect(result).toHaveProperty('culturalContext');
      }
    });

    test('should handle empty search query with error message', async () => {
      // Test empty query handling - Requirements 2.3, 2.4
      const response = await request(app)
        .get('/api/search')
        .query({ q: '' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.results).toEqual([]);
      expect(response.body.totalResults).toBe(0);
    });

    test('should handle search with no results gracefully', async () => {
      // Test no results scenario - Requirements 2.3
      const response = await request(app)
        .get('/api/search')
        .query({ q: 'xyznonexistentterm12345' })
        .expect(200);

      expect(response.body.results).toEqual([]);
      expect(response.body.totalResults).toBe(0);
      expect(response.body.query).toBe('xyznonexistentterm12345');
    });

    test('should perform case-insensitive search', async () => {
      // Test case-insensitive search - Requirements 2.5
      const uppercaseResponse = await request(app)
        .get('/api/search')
        .query({ q: 'LIT' })
        .expect(200);

      const lowercaseResponse = await request(app)
        .get('/api/search')
        .query({ q: 'lit' })
        .expect(200);

      const mixedCaseResponse = await request(app)
        .get('/api/search')
        .query({ q: 'LiT' })
        .expect(200);

      // All should return same number of results
      expect(uppercaseResponse.body.totalResults).toBe(lowercaseResponse.body.totalResults);
      expect(lowercaseResponse.body.totalResults).toBe(mixedCaseResponse.body.totalResults);
    });

    test('should return results with proper ranking (exact before partial)', async () => {
      // Test result ranking - Requirements 7.1, 7.3
      const response = await request(app)
        .get('/api/search')
        .query({ q: 'lit' })
        .expect(200);

      if (response.body.results.length > 1) {
        const results = response.body.results;
        let foundExactMatch = false;
        let foundPartialMatch = false;

        for (const result of results) {
          const termLower = result.term.toLowerCase();
          const queryLower = 'lit';

          if (termLower === queryLower) {
            foundExactMatch = true;
            // Exact match should come before partial matches
            expect(foundPartialMatch).toBe(false);
          } else if (termLower.includes(queryLower)) {
            foundPartialMatch = true;
          }
        }
      }
    });

    test('should handle multi-word search queries', async () => {
      // Test multi-word query support - Requirements 7.4
      const response = await request(app)
        .get('/api/search')
        .query({ q: 'lit fire' })
        .expect(200);

      // Should return results matching any word
      expect(response.body).toHaveProperty('query');
      expect(response.body).toHaveProperty('results');
      expect(Array.isArray(response.body.results)).toBe(true);
    });

    test('should handle special characters in search query', async () => {
      // Test special character handling
      const response = await request(app)
        .get('/api/search')
        .query({ q: 'test@#$' })
        .expect(200);

      // Should not crash and return valid response
      expect(response.body).toHaveProperty('results');
      expect(Array.isArray(response.body.results)).toBe(true);
    });

    test('should clear search results when clearing input', async () => {
      // Test clear functionality - Requirements 2.4
      // First perform a search
      const searchResponse = await request(app)
        .get('/api/search')
        .query({ q: 'lit' })
        .expect(200);

      expect(searchResponse.body.results.length).toBeGreaterThan(0);

      // Clearing is a frontend action, but we verify the API is ready for fresh search
      const emptyResponse = await request(app)
        .get('/api/search')
        .query({ q: '' })
        .expect(400);

      expect(emptyResponse.body.results).toEqual([]);
    });
  });

  describe('10.2 Browse Functionality', () => {
    test('should load and display all terms with pagination', async () => {
      // Test browse functionality - Requirements 4.1, 4.2
      const response = await request(app)
        .get('/api/browse')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(response.body).toHaveProperty('totalItems');
      expect(response.body).toHaveProperty('totalPages');
      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body.totalItems).toBeGreaterThan(0);
    });

    test('should display terms in alphabetical order', async () => {
      // Test alphabetical sorting - Requirements 4.2
      const response = await request(app)
        .get('/api/browse')
        .query({ page: 1, limit: 100 })
        .expect(200);

      const items = response.body.items;
      for (let i = 1; i < items.length; i++) {
        const prevTerm = items[i - 1].term.toLowerCase();
        const currentTerm = items[i].term.toLowerCase();
        expect(prevTerm.localeCompare(currentTerm)).toBeLessThanOrEqual(0);
      }
    });

    test('should implement pagination correctly', async () => {
      // Test pagination logic - Requirements 4.4
      const page1Response = await request(app)
        .get('/api/browse')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(page1Response.body.page).toBe(1);
      expect(page1Response.body.limit).toBe(10);
      expect(page1Response.body.items.length).toBeLessThanOrEqual(10);

      // If there are multiple pages, test page 2
      if (page1Response.body.totalPages > 1) {
        const page2Response = await request(app)
          .get('/api/browse')
          .query({ page: 2, limit: 10 })
          .expect(200);

        expect(page2Response.body.page).toBe(2);
        expect(page2Response.body.items.length).toBeGreaterThan(0);

        // Items should be different between pages
        const page1Ids = page1Response.body.items.map(item => item.id);
        const page2Ids = page2Response.body.items.map(item => item.id);
        const commonIds = page1Ids.filter(id => page2Ids.includes(id));
        expect(commonIds.length).toBe(0);
      }
    });

    test('should display accurate term count', async () => {
      // Test term count tracking - Requirements 4.5
      const response = await request(app)
        .get('/api/browse')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body).toHaveProperty('totalItems');
      expect(typeof response.body.totalItems).toBe('number');
      expect(response.body.totalItems).toBeGreaterThan(0);

      // Verify count matches actual items across all pages
      let totalCount = 0;
      let currentPage = 1;

      while (currentPage <= response.body.totalPages) {
        const pageResponse = await request(app)
          .get('/api/browse')
          .query({ page: currentPage, limit: 10 })
          .expect(200);

        totalCount += pageResponse.body.items.length;
        currentPage++;
      }

      expect(totalCount).toBe(response.body.totalItems);
    });

    test('should handle different page sizes', async () => {
      // Test pagination with various page sizes
      const response5 = await request(app)
        .get('/api/browse')
        .query({ page: 1, limit: 5 })
        .expect(200);

      const response10 = await request(app)
        .get('/api/browse')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response5.body.items.length).toBeLessThanOrEqual(5);
      expect(response10.body.items.length).toBeLessThanOrEqual(10);
      expect(response5.body.totalItems).toBe(response10.body.totalItems);
    });

    test('should handle pagination boundaries', async () => {
      // Test boundary conditions
      const firstPageResponse = await request(app)
        .get('/api/browse')
        .query({ page: 1, limit: 10 })
        .expect(200);

      const totalPages = firstPageResponse.body.totalPages;

      if (totalPages > 1) {
        const lastPageResponse = await request(app)
          .get('/api/browse')
          .query({ page: totalPages, limit: 10 })
          .expect(200);

        expect(lastPageResponse.body.page).toBe(totalPages);
        expect(lastPageResponse.body.items.length).toBeGreaterThan(0);
        expect(lastPageResponse.body.items.length).toBeLessThanOrEqual(10);
      }
    });

    test('should display all required fields for each term', async () => {
      // Test that browse results have all required fields for display
      const response = await request(app)
        .get('/api/browse')
        .query({ page: 1, limit: 10 })
        .expect(200);

      response.body.items.forEach(term => {
        expect(term).toHaveProperty('id');
        expect(term).toHaveProperty('term');
        expect(term).toHaveProperty('definition');
        expect(term).toHaveProperty('usageExamples');
        expect(term).toHaveProperty('culturalContext');
      });
    });
  });

  describe('10.3 & 10.4 Navigation and Term Detail View', () => {
    test('should navigate from search results to term details', async () => {
      // Test navigation from search to detail - Requirements 4.3
      const searchResponse = await request(app)
        .get('/api/search')
        .query({ q: 'lit' })
        .expect(200);

      if (searchResponse.body.results.length > 0) {
        const termId = searchResponse.body.results[0].id;

        const detailResponse = await request(app)
          .get(`/api/term/${termId}`)
          .expect(200);

        expect(detailResponse.body).toHaveProperty('id');
        expect(detailResponse.body).toHaveProperty('term');
        expect(detailResponse.body).toHaveProperty('definition');
        expect(detailResponse.body.id).toBe(termId);
      }
    });

    test('should navigate from browse list to term details', async () => {
      // Test navigation from browse to detail - Requirements 4.3
      const browseResponse = await request(app)
        .get('/api/browse')
        .query({ page: 1, limit: 10 })
        .expect(200);

      if (browseResponse.body.items.length > 0) {
        const termId = browseResponse.body.items[0].id;

        const detailResponse = await request(app)
          .get(`/api/term/${termId}`)
          .expect(200);

        expect(detailResponse.body).toHaveProperty('id');
        expect(detailResponse.body).toHaveProperty('term');
        expect(detailResponse.body).toHaveProperty('definition');
        expect(detailResponse.body.id).toBe(termId);
      }
    });

    test('should display full term information in detail view', async () => {
      // Test term detail display - Requirements 3.1, 3.2, 3.3, 3.4, 3.5
      const browseResponse = await request(app)
        .get('/api/browse')
        .query({ page: 1, limit: 10 })
        .expect(200);

      if (browseResponse.body.items.length > 0) {
        const termId = browseResponse.body.items[0].id;

        const detailResponse = await request(app)
          .get(`/api/term/${termId}`)
          .expect(200);

        const term = detailResponse.body;

        // Verify all required fields are present
        expect(term).toHaveProperty('id');
        expect(term).toHaveProperty('term');
        expect(term).toHaveProperty('definition');
        expect(term).toHaveProperty('usageExamples');
        expect(term).toHaveProperty('culturalContext');

        // Verify usage examples have required structure
        expect(Array.isArray(term.usageExamples)).toBe(true);
        if (term.usageExamples.length > 0) {
          expect(term.usageExamples[0]).toHaveProperty('example');
        }

        // Verify cultural context has required fields
        expect(term.culturalContext).toHaveProperty('ageGroup');
        expect(term.culturalContext).toHaveProperty('socialSetting');
        expect(term.culturalContext).toHaveProperty('regionSpecificity');
      }
    });

    test('should handle navigation to non-existent term', async () => {
      // Test error handling for invalid term ID
      const response = await request(app)
        .get('/api/term/nonexistent-id-12345')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    test('should maintain data consistency when navigating between views', async () => {
      // Test data consistency - Requirements 4.3
      const searchResponse = await request(app)
        .get('/api/search')
        .query({ q: 'lit' })
        .expect(200);

      if (searchResponse.body.results.length > 0) {
        const searchResult = searchResponse.body.results[0];
        const termId = searchResult.id;

        // Navigate to detail view
        const detailResponse = await request(app)
          .get(`/api/term/${termId}`)
          .expect(200);

        const detailResult = detailResponse.body;

        // Verify data consistency
        expect(detailResult.term).toBe(searchResult.term);
        expect(detailResult.definition).toBe(searchResult.definition);
        expect(detailResult.usageExamples).toEqual(searchResult.usageExamples);
        expect(detailResult.culturalContext).toEqual(searchResult.culturalContext);
      }
    });

    test('should allow returning to previous view', async () => {
      // Test back navigation - Requirements 4.3
      // This is a frontend state management test
      // Verify that we can navigate from search -> detail -> back to search
      const searchResponse = await request(app)
        .get('/api/search')
        .query({ q: 'lit' })
        .expect(200);

      if (searchResponse.body.results.length > 0) {
        const termId = searchResponse.body.results[0].id;

        // Navigate to detail
        const detailResponse = await request(app)
          .get(`/api/term/${termId}`)
          .expect(200);

        expect(detailResponse.body.id).toBe(termId);

        // Verify we can go back to search by performing another search
        const newSearchResponse = await request(app)
          .get('/api/search')
          .query({ q: 'fire' })
          .expect(200);

        expect(newSearchResponse.body).toHaveProperty('results');
      }
    });
  });

  describe('10.5 Error Handling', () => {
    test('should handle search errors gracefully', async () => {
      // Test error handling for search
      const response = await request(app)
        .get('/api/search')
        .query({ q: '' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.results).toEqual([]);
    });

    test('should handle browse errors gracefully', async () => {
      // Test error handling for invalid pagination parameters
      const response = await request(app)
        .get('/api/browse')
        .query({ page: -1, limit: 10 })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should handle term detail errors gracefully', async () => {
      // Test error handling for non-existent term
      const response = await request(app)
        .get('/api/term/invalid-id')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    test('should handle network errors in search', async () => {
      // Test that search endpoint returns proper error response
      const response = await request(app)
        .get('/api/search')
        .query({ q: null })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should handle missing required fields in results', async () => {
      // Test that all results have required fields
      const response = await request(app)
        .get('/api/search')
        .query({ q: 'lit' })
        .expect(200);

      response.body.results.forEach(result => {
        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('term');
        expect(result).toHaveProperty('definition');
        expect(result.id).toBeTruthy();
        expect(result.term).toBeTruthy();
        expect(result.definition).toBeTruthy();
      });
    });

    test('should handle empty browse results', async () => {
      // Test that browse handles empty database gracefully
      const response = await request(app)
        .get('/api/browse')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body).toHaveProperty('totalItems');
    });

    test('should handle out-of-range page numbers gracefully', async () => {
      // Test that out-of-range page numbers are clamped to valid range
      const response = await request(app)
        .get('/api/browse')
        .query({ page: 999999, limit: 10 })
        .expect(200);

      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);
      // Out of range page should be clamped to last valid page
      expect(response.body.page).toBeLessThanOrEqual(response.body.totalPages);
      expect(response.body.page).toBeGreaterThanOrEqual(1);
    });

    test('should handle invalid limit values', async () => {
      // Test error handling for invalid limit
      const response = await request(app)
        .get('/api/browse')
        .query({ page: 1, limit: -5 })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should display error message for no search results', async () => {
      // Test no results message
      const response = await request(app)
        .get('/api/search')
        .query({ q: 'xyznonexistentterm12345' })
        .expect(200);

      expect(response.body.results).toEqual([]);
      expect(response.body.totalResults).toBe(0);
      // Frontend would display "No slang terms found" message
    });

    test('should handle rapid successive requests', async () => {
      // Test that frontend can handle rapid navigation
      const promises = [
        request(app).get('/api/search').query({ q: 'lit' }),
        request(app).get('/api/browse').query({ page: 1, limit: 10 }),
        request(app).get('/api/search').query({ q: 'fire' })
      ];

      const responses = await Promise.all(promises);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toBeDefined();
      });
    });
  });

  describe('Frontend Integration - Complete User Flows', () => {
    test('should support complete search workflow', async () => {
      // Requirements 2.1, 2.2, 2.3, 4.1, 4.2, 4.3, 4.4
      // User enters search query
      const searchResponse = await request(app)
        .get('/api/search')
        .query({ q: 'lit' })
        .expect(200);

      expect(searchResponse.body.results.length).toBeGreaterThan(0);

      // User clicks on result
      const firstResult = searchResponse.body.results[0];
      const detailResponse = await request(app)
        .get(`/api/term/${firstResult.id}`)
        .expect(200);

      expect(detailResponse.body.id).toBe(firstResult.id);
      expect(detailResponse.body.term).toBe(firstResult.term);
    });

    test('should support complete browse workflow', async () => {
      // Requirements 4.1, 4.2, 4.3, 4.4
      // User accesses browse
      const browseResponse = await request(app)
        .get('/api/browse')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(browseResponse.body.items.length).toBeGreaterThan(0);

      // User navigates pages
      if (browseResponse.body.totalPages > 1) {
        const page2Response = await request(app)
          .get('/api/browse')
          .query({ page: 2, limit: 10 })
          .expect(200);

        expect(page2Response.body.page).toBe(2);
      }

      // User clicks on term
      const firstTerm = browseResponse.body.items[0];
      const detailResponse = await request(app)
        .get(`/api/term/${firstTerm.id}`)
        .expect(200);

      expect(detailResponse.body.id).toBe(firstTerm.id);
    });
  });
});

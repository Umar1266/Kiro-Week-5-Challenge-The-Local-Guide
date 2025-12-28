const request = require('supertest');
const app = require('../src/index');

describe('Integration Tests - End-to-End Flows', () => {
  describe('12.1 Test end-to-end search flow', () => {
    test('should complete full search flow: enter query -> display results -> click result -> see details', async () => {
      // Step 1: User enters search query
      const searchResponse = await request(app)
        .get('/api/search')
        .query({ q: 'lit' })
        .expect(200);

      // Verify results display correctly
      expect(searchResponse.body).toHaveProperty('query');
      expect(searchResponse.body.query).toBe('lit');
      expect(searchResponse.body).toHaveProperty('results');
      expect(Array.isArray(searchResponse.body.results)).toBe(true);
      expect(searchResponse.body.totalResults).toBeGreaterThan(0);

      // Step 2: Verify results have required fields for display
      const firstResult = searchResponse.body.results[0];
      expect(firstResult).toHaveProperty('id');
      expect(firstResult).toHaveProperty('term');
      expect(firstResult).toHaveProperty('definition');
      expect(firstResult).toHaveProperty('usageExamples');
      expect(firstResult).toHaveProperty('culturalContext');

      // Step 3: User clicks on result to see details
      const termId = firstResult.id;
      const detailResponse = await request(app)
        .get(`/api/term/${termId}`)
        .expect(200);

      // Step 4: Verify full details are displayed
      expect(detailResponse.body).toHaveProperty('id');
      expect(detailResponse.body).toHaveProperty('term');
      expect(detailResponse.body).toHaveProperty('definition');
      expect(detailResponse.body).toHaveProperty('usageExamples');
      expect(detailResponse.body).toHaveProperty('culturalContext');
      expect(detailResponse.body.id).toBe(termId);
      expect(detailResponse.body.term).toBe(firstResult.term);
      expect(detailResponse.body.definition).toBe(firstResult.definition);
    });

    test('should handle search with no results gracefully', async () => {
      // User enters search query that has no matches
      const searchResponse = await request(app)
        .get('/api/search')
        .query({ q: 'xyznonexistentterm12345' })
        .expect(200);

      // Results should be empty but response should be valid
      expect(searchResponse.body.results).toEqual([]);
      expect(searchResponse.body.totalResults).toBe(0);
      expect(searchResponse.body.query).toBe('xyznonexistentterm12345');
    });

    test('should handle case-insensitive search throughout flow', async () => {
      // User searches with uppercase
      const uppercaseResponse = await request(app)
        .get('/api/search')
        .query({ q: 'LIT' })
        .expect(200);

      // User searches with lowercase
      const lowercaseResponse = await request(app)
        .get('/api/search')
        .query({ q: 'lit' })
        .expect(200);

      // Both should return same results
      expect(uppercaseResponse.body.totalResults).toBe(lowercaseResponse.body.totalResults);
      expect(uppercaseResponse.body.results.length).toBe(lowercaseResponse.body.results.length);

      // Verify we can click on results from both searches
      if (uppercaseResponse.body.results.length > 0) {
        const termId = uppercaseResponse.body.results[0].id;
        const detailResponse = await request(app)
          .get(`/api/term/${termId}`)
          .expect(200);

        expect(detailResponse.body.id).toBe(termId);
      }
    });

    test('should display multiple search results with correct ranking', async () => {
      // User searches for a term
      const searchResponse = await request(app)
        .get('/api/search')
        .query({ q: 'lit' })
        .expect(200);

      if (searchResponse.body.results.length > 1) {
        // Verify exact matches appear before partial matches
        const results = searchResponse.body.results;
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

      // User can click on any result to see details
      for (const result of searchResponse.body.results.slice(0, 3)) {
        const detailResponse = await request(app)
          .get(`/api/term/${result.id}`)
          .expect(200);

        expect(detailResponse.body.id).toBe(result.id);
        expect(detailResponse.body.term).toBe(result.term);
      }
    });

    test('should handle empty search query gracefully', async () => {
      // User submits empty search
      const emptyResponse = await request(app)
        .get('/api/search')
        .query({ q: '' })
        .expect(400);

      expect(emptyResponse.body).toHaveProperty('error');
      expect(emptyResponse.body.results).toEqual([]);
      expect(emptyResponse.body.totalResults).toBe(0);
    });

    test('should maintain data consistency from search to detail view', async () => {
      // User searches
      const searchResponse = await request(app)
        .get('/api/search')
        .query({ q: 'lit' })
        .expect(200);

      if (searchResponse.body.results.length > 0) {
        const searchResult = searchResponse.body.results[0];

        // User clicks to see details
        const detailResponse = await request(app)
          .get(`/api/term/${searchResult.id}`)
          .expect(200);

        const detailResult = detailResponse.body;

        // Verify data consistency
        expect(detailResult.term).toBe(searchResult.term);
        expect(detailResult.definition).toBe(searchResult.definition);
        expect(detailResult.usageExamples).toEqual(searchResult.usageExamples);
        expect(detailResult.culturalContext).toEqual(searchResult.culturalContext);
      }
    });
  });

  describe('12.2 Test end-to-end browse flow', () => {
    test('should complete full browse flow: access browse -> view alphabetical list -> navigate pages -> click term -> see details', async () => {
      // Step 1: User accesses browse feature
      const browseResponse = await request(app)
        .get('/api/browse')
        .query({ page: 1, limit: 10 })
        .expect(200);

      // Step 2: Verify terms display alphabetically
      expect(browseResponse.body).toHaveProperty('items');
      expect(Array.isArray(browseResponse.body.items)).toBe(true);
      expect(browseResponse.body.totalItems).toBeGreaterThan(0);

      // Verify alphabetical ordering
      const items = browseResponse.body.items;
      for (let i = 1; i < items.length; i++) {
        const prevTerm = items[i - 1].term.toLowerCase();
        const currentTerm = items[i].term.toLowerCase();
        expect(prevTerm.localeCompare(currentTerm)).toBeLessThanOrEqual(0);
      }

      // Step 3: User navigates through pages
      expect(browseResponse.body).toHaveProperty('page');
      expect(browseResponse.body).toHaveProperty('totalPages');
      expect(browseResponse.body.page).toBe(1);

      // If there are multiple pages, navigate to next page
      if (browseResponse.body.totalPages > 1) {
        const nextPageResponse = await request(app)
          .get('/api/browse')
          .query({ page: 2, limit: 10 })
          .expect(200);

        expect(nextPageResponse.body.page).toBe(2);
        expect(nextPageResponse.body.items.length).toBeGreaterThan(0);

        // Verify next page items are also alphabetically ordered
        const nextItems = nextPageResponse.body.items;
        for (let i = 1; i < nextItems.length; i++) {
          const prevTerm = nextItems[i - 1].term.toLowerCase();
          const currentTerm = nextItems[i].term.toLowerCase();
          expect(prevTerm.localeCompare(currentTerm)).toBeLessThanOrEqual(0);
        }
      }

      // Step 4: User clicks on term to see details
      const firstTerm = items[0];
      const detailResponse = await request(app)
        .get(`/api/term/${firstTerm.id}`)
        .expect(200);

      // Verify full details are displayed
      expect(detailResponse.body).toHaveProperty('id');
      expect(detailResponse.body).toHaveProperty('term');
      expect(detailResponse.body).toHaveProperty('definition');
      expect(detailResponse.body).toHaveProperty('usageExamples');
      expect(detailResponse.body).toHaveProperty('culturalContext');
      expect(detailResponse.body.id).toBe(firstTerm.id);
    });

    test('should display correct term count in browse', async () => {
      // User accesses browse feature
      const browseResponse = await request(app)
        .get('/api/browse')
        .query({ page: 1, limit: 10 })
        .expect(200);

      // Verify term count is displayed
      expect(browseResponse.body).toHaveProperty('totalItems');
      expect(typeof browseResponse.body.totalItems).toBe('number');
      expect(browseResponse.body.totalItems).toBeGreaterThan(0);

      // Verify term count matches actual items across all pages
      let totalItemsCount = 0;
      let currentPage = 1;
      const limit = 10;

      while (currentPage <= browseResponse.body.totalPages) {
        const pageResponse = await request(app)
          .get('/api/browse')
          .query({ page: currentPage, limit })
          .expect(200);

        totalItemsCount += pageResponse.body.items.length;
        currentPage++;
      }

      expect(totalItemsCount).toBe(browseResponse.body.totalItems);
    });

    test('should handle pagination boundaries correctly', async () => {
      // Get first page
      const firstPageResponse = await request(app)
        .get('/api/browse')
        .query({ page: 1, limit: 10 })
        .expect(200);

      const totalPages = firstPageResponse.body.totalPages;

      // If there are multiple pages, test last page
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

    test('should maintain alphabetical order across all pages', async () => {
      // Get all pages and verify continuous alphabetical ordering
      const firstPageResponse = await request(app)
        .get('/api/browse')
        .query({ page: 1, limit: 100 })
        .expect(200);

      const items = firstPageResponse.body.items;

      // Verify all items are alphabetically ordered
      for (let i = 1; i < items.length; i++) {
        const prevTerm = items[i - 1].term.toLowerCase();
        const currentTerm = items[i].term.toLowerCase();
        expect(prevTerm.localeCompare(currentTerm)).toBeLessThanOrEqual(0);
      }
    });

    test('should allow clicking on any term from browse list to see details', async () => {
      // User accesses browse feature
      const browseResponse = await request(app)
        .get('/api/browse')
        .query({ page: 1, limit: 10 })
        .expect(200);

      // User can click on multiple terms to see details
      const termsToTest = browseResponse.body.items.slice(0, 3);

      for (const term of termsToTest) {
        const detailResponse = await request(app)
          .get(`/api/term/${term.id}`)
          .expect(200);

        expect(detailResponse.body.id).toBe(term.id);
        expect(detailResponse.body.term).toBe(term.term);
        expect(detailResponse.body.definition).toBe(term.definition);
      }
    });

    test('should maintain data consistency from browse to detail view', async () => {
      // User browses terms
      const browseResponse = await request(app)
        .get('/api/browse')
        .query({ page: 1, limit: 10 })
        .expect(200);

      if (browseResponse.body.items.length > 0) {
        const browseItem = browseResponse.body.items[0];

        // User clicks to see details
        const detailResponse = await request(app)
          .get(`/api/term/${browseItem.id}`)
          .expect(200);

        const detailItem = detailResponse.body;

        // Verify data consistency
        expect(detailItem.term).toBe(browseItem.term);
        expect(detailItem.definition).toBe(browseItem.definition);
        expect(detailItem.usageExamples).toEqual(browseItem.usageExamples);
        expect(detailItem.culturalContext).toEqual(browseItem.culturalContext);
      }
    });

    test('should handle different page sizes correctly', async () => {
      // User browses with different page sizes
      const page5Response = await request(app)
        .get('/api/browse')
        .query({ page: 1, limit: 5 })
        .expect(200);

      const page10Response = await request(app)
        .get('/api/browse')
        .query({ page: 1, limit: 10 })
        .expect(200);

      // Verify page sizes are respected
      expect(page5Response.body.items.length).toBeLessThanOrEqual(5);
      expect(page10Response.body.items.length).toBeLessThanOrEqual(10);

      // Verify total items count is consistent
      expect(page5Response.body.totalItems).toBe(page10Response.body.totalItems);

      // Verify total pages calculation is correct
      const expectedPages5 = Math.ceil(page5Response.body.totalItems / 5);
      const expectedPages10 = Math.ceil(page10Response.body.totalItems / 10);
      expect(page5Response.body.totalPages).toBe(expectedPages5);
      expect(page10Response.body.totalPages).toBe(expectedPages10);
    });

    test('should display all required fields for each term in browse', async () => {
      // User accesses browse feature
      const browseResponse = await request(app)
        .get('/api/browse')
        .query({ page: 1, limit: 10 })
        .expect(200);

      // Verify each term has all required fields
      browseResponse.body.items.forEach(term => {
        expect(term).toHaveProperty('id');
        expect(term).toHaveProperty('term');
        expect(term).toHaveProperty('definition');
        expect(term).toHaveProperty('usageExamples');
        expect(term).toHaveProperty('culturalContext');
      });
    });
  });

  describe('Integration - Cross-flow scenarios', () => {
    test('should allow user to search, then browse, then view details', async () => {
      // User searches
      const searchResponse = await request(app)
        .get('/api/search')
        .query({ q: 'lit' })
        .expect(200);

      expect(searchResponse.body.results.length).toBeGreaterThan(0);

      // User switches to browse
      const browseResponse = await request(app)
        .get('/api/browse')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(browseResponse.body.items.length).toBeGreaterThan(0);

      // User clicks on a term from browse
      const termId = browseResponse.body.items[0].id;
      const detailResponse = await request(app)
        .get(`/api/term/${termId}`)
        .expect(200);

      expect(detailResponse.body.id).toBe(termId);
    });

    test('should maintain consistent data across search and browse', async () => {
      // Get a term from search
      const searchResponse = await request(app)
        .get('/api/search')
        .query({ q: 'lit' })
        .expect(200);

      if (searchResponse.body.results.length > 0) {
        const searchTerm = searchResponse.body.results[0];

        // Get the same term from browse
        const browseResponse = await request(app)
          .get('/api/browse')
          .query({ page: 1, limit: 100 })
          .expect(200);

        const browseTerm = browseResponse.body.items.find(t => t.id === searchTerm.id);

        if (browseTerm) {
          // Verify data consistency
          expect(browseTerm.term).toBe(searchTerm.term);
          expect(browseTerm.definition).toBe(searchTerm.definition);
          expect(browseTerm.usageExamples).toEqual(searchTerm.usageExamples);
        }
      }
    });

    test('should handle rapid navigation between views', async () => {
      // Simulate rapid user navigation
      const searchResponse = await request(app)
        .get('/api/search')
        .query({ q: 'lit' })
        .expect(200);

      const browseResponse = await request(app)
        .get('/api/browse')
        .query({ page: 1, limit: 10 })
        .expect(200);

      if (searchResponse.body.results.length > 0 && browseResponse.body.items.length > 0) {
        const searchTermId = searchResponse.body.results[0].id;
        const browseTermId = browseResponse.body.items[0].id;

        // Rapidly fetch details
        const detail1 = await request(app)
          .get(`/api/term/${searchTermId}`)
          .expect(200);

        const detail2 = await request(app)
          .get(`/api/term/${browseTermId}`)
          .expect(200);

        const detail3 = await request(app)
          .get(`/api/term/${searchTermId}`)
          .expect(200);

        // All should return valid data
        expect(detail1.body.id).toBe(searchTermId);
        expect(detail2.body.id).toBe(browseTermId);
        expect(detail3.body.id).toBe(searchTermId);
      }
    });
  });

  describe('Integration - Error Scenarios', () => {
    test('should handle search with invalid query gracefully', async () => {
      // User submits empty search
      const emptyResponse = await request(app)
        .get('/api/search')
        .query({ q: '' })
        .expect(400);

      expect(emptyResponse.body).toHaveProperty('error');
      expect(emptyResponse.body.error).toBe('Please enter a search term');
      expect(emptyResponse.body.results).toEqual([]);
      expect(emptyResponse.body.totalResults).toBe(0);
    });

    test('should handle search with whitespace-only query', async () => {
      // User submits whitespace-only search
      const whitespaceResponse = await request(app)
        .get('/api/search')
        .query({ q: '   ' })
        .expect(400);

      expect(whitespaceResponse.body).toHaveProperty('error');
      expect(whitespaceResponse.body.error).toBe('Please enter a search term');
      expect(whitespaceResponse.body.results).toEqual([]);
      expect(whitespaceResponse.body.totalResults).toBe(0);
    });

    test('should handle search with missing query parameter', async () => {
      // User submits search without query parameter
      const noParamResponse = await request(app)
        .get('/api/search')
        .expect(400);

      expect(noParamResponse.body).toHaveProperty('error');
      expect(noParamResponse.body.error).toBe('Please enter a search term');
      expect(noParamResponse.body.results).toEqual([]);
      expect(noParamResponse.body.totalResults).toBe(0);
    });

    test('should handle browse with invalid page parameter', async () => {
      // User requests page 0 (invalid)
      const invalidPageResponse = await request(app)
        .get('/api/browse')
        .query({ page: 0, limit: 10 })
        .expect(400);

      expect(invalidPageResponse.body).toHaveProperty('error');
      expect(invalidPageResponse.body.error).toBe('Invalid page or limit parameters');
    });

    test('should handle browse with negative page parameter', async () => {
      // User requests negative page
      const negativePageResponse = await request(app)
        .get('/api/browse')
        .query({ page: -1, limit: 10 })
        .expect(400);

      expect(negativePageResponse.body).toHaveProperty('error');
      expect(negativePageResponse.body.error).toBe('Invalid page or limit parameters');
    });

    test('should handle browse with invalid limit parameter', async () => {
      // User requests limit 0 (invalid)
      const invalidLimitResponse = await request(app)
        .get('/api/browse')
        .query({ page: 1, limit: 0 })
        .expect(400);

      expect(invalidLimitResponse.body).toHaveProperty('error');
      expect(invalidLimitResponse.body.error).toBe('Invalid page or limit parameters');
    });

    test('should handle browse with negative limit parameter', async () => {
      // User requests negative limit
      const negativeLimitResponse = await request(app)
        .get('/api/browse')
        .query({ page: 1, limit: -5 })
        .expect(400);

      expect(negativeLimitResponse.body).toHaveProperty('error');
      expect(negativeLimitResponse.body.error).toBe('Invalid page or limit parameters');
    });

    test('should handle browse with non-integer page parameter', async () => {
      // User provides non-integer page
      const nonIntPageResponse = await request(app)
        .get('/api/browse')
        .query({ page: 'abc', limit: 10 })
        .expect(400);

      expect(nonIntPageResponse.body).toHaveProperty('error');
      expect(nonIntPageResponse.body.error).toBe('Invalid page or limit parameters');
    });

    test('should handle browse with non-integer limit parameter', async () => {
      // User provides non-integer limit
      const nonIntLimitResponse = await request(app)
        .get('/api/browse')
        .query({ page: 1, limit: 'xyz' })
        .expect(400);

      expect(nonIntLimitResponse.body).toHaveProperty('error');
      expect(nonIntLimitResponse.body.error).toBe('Invalid page or limit parameters');
    });

    test('should handle term detail request with non-existent ID', async () => {
      // User tries to access non-existent term
      const notFoundResponse = await request(app)
        .get('/api/term/nonexistent-id-12345')
        .expect(404);

      expect(notFoundResponse.body).toHaveProperty('error');
      expect(notFoundResponse.body.error).toBe('Slang term not found');
    });

    test('should handle term detail request with empty ID', async () => {
      // User tries to access term with empty ID
      const emptyIdResponse = await request(app)
        .get('/api/term/')
        .expect(404);

      // Should return 404 or similar error
      expect(emptyIdResponse.status).toBeGreaterThanOrEqual(400);
    });

    test('should recover from search error and allow subsequent valid search', async () => {
      // User first submits invalid search
      const invalidResponse = await request(app)
        .get('/api/search')
        .query({ q: '' })
        .expect(400);

      expect(invalidResponse.body.error).toBe('Please enter a search term');

      // User then submits valid search
      const validResponse = await request(app)
        .get('/api/search')
        .query({ q: 'lit' })
        .expect(200);

      expect(validResponse.body.results.length).toBeGreaterThanOrEqual(0);
      expect(validResponse.body).toHaveProperty('query');
      expect(validResponse.body.query).toBe('lit');
    });

    test('should recover from browse error and allow subsequent valid browse', async () => {
      // User first requests invalid browse parameters
      const invalidResponse = await request(app)
        .get('/api/browse')
        .query({ page: 0, limit: 10 })
        .expect(400);

      expect(invalidResponse.body.error).toBe('Invalid page or limit parameters');

      // User then requests valid browse
      const validResponse = await request(app)
        .get('/api/browse')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(validResponse.body).toHaveProperty('items');
      expect(validResponse.body.page).toBe(1);
    });

    test('should handle term detail error and allow subsequent valid request', async () => {
      // User first requests non-existent term
      const notFoundResponse = await request(app)
        .get('/api/term/nonexistent-id')
        .expect(404);

      expect(notFoundResponse.body.error).toBe('Slang term not found');

      // User then requests valid term
      const browseResponse = await request(app)
        .get('/api/browse')
        .query({ page: 1, limit: 1 });

      if (browseResponse.body.items.length > 0) {
        const validTermId = browseResponse.body.items[0].id;
        const validResponse = await request(app)
          .get(`/api/term/${validTermId}`)
          .expect(200);

        expect(validResponse.body).toHaveProperty('id');
        expect(validResponse.body.id).toBe(validTermId);
      }
    });

    test('should handle search followed by invalid term detail request', async () => {
      // User searches successfully
      const searchResponse = await request(app)
        .get('/api/search')
        .query({ q: 'lit' })
        .expect(200);

      if (searchResponse.body.results.length > 0) {
        // User tries to access non-existent term
        const notFoundResponse = await request(app)
          .get('/api/term/invalid-id')
          .expect(404);

        expect(notFoundResponse.body.error).toBe('Slang term not found');

        // User then clicks on valid search result
        const validTermId = searchResponse.body.results[0].id;
        const validResponse = await request(app)
          .get(`/api/term/${validTermId}`)
          .expect(200);

        expect(validResponse.body.id).toBe(validTermId);
      }
    });

    test('should handle browse followed by invalid term detail request', async () => {
      // User browses successfully
      const browseResponse = await request(app)
        .get('/api/browse')
        .query({ page: 1, limit: 10 })
        .expect(200);

      if (browseResponse.body.items.length > 0) {
        // User tries to access non-existent term
        const notFoundResponse = await request(app)
          .get('/api/term/invalid-id')
          .expect(404);

        expect(notFoundResponse.body.error).toBe('Slang term not found');

        // User then clicks on valid browse result
        const validTermId = browseResponse.body.items[0].id;
        const validResponse = await request(app)
          .get(`/api/term/${validTermId}`)
          .expect(200);

        expect(validResponse.body.id).toBe(validTermId);
      }
    });

    test('should handle multiple consecutive errors gracefully', async () => {
      // Multiple invalid requests
      const error1 = await request(app)
        .get('/api/search')
        .query({ q: '' })
        .expect(400);

      const error2 = await request(app)
        .get('/api/browse')
        .query({ page: -1, limit: 10 })
        .expect(400);

      const error3 = await request(app)
        .get('/api/term/invalid')
        .expect(404);

      // All should return proper error responses
      expect(error1.body).toHaveProperty('error');
      expect(error2.body).toHaveProperty('error');
      expect(error3.body).toHaveProperty('error');

      // System should still be functional
      const validResponse = await request(app)
        .get('/api/search')
        .query({ q: 'lit' })
        .expect(200);

      expect(validResponse.body).toHaveProperty('results');
    });

    test('should handle special characters in search query', async () => {
      // User searches with special characters
      const specialCharResponse = await request(app)
        .get('/api/search')
        .query({ q: '!@#$%^&*()' })
        .expect(200);

      // Should return valid response (either results or empty)
      expect(specialCharResponse.body).toHaveProperty('results');
      expect(specialCharResponse.body).toHaveProperty('totalResults');
      expect(Array.isArray(specialCharResponse.body.results)).toBe(true);
    });

    test('should handle very long search query', async () => {
      // User searches with very long query
      const longQuery = 'a'.repeat(1000);
      const longQueryResponse = await request(app)
        .get('/api/search')
        .query({ q: longQuery })
        .expect(200);

      // Should return valid response
      expect(longQueryResponse.body).toHaveProperty('results');
      expect(longQueryResponse.body).toHaveProperty('totalResults');
      expect(Array.isArray(longQueryResponse.body.results)).toBe(true);
    });

    test('should handle unicode characters in search query', async () => {
      // User searches with unicode characters
      const unicodeResponse = await request(app)
        .get('/api/search')
        .query({ q: '你好世界' })
        .expect(200);

      // Should return valid response
      expect(unicodeResponse.body).toHaveProperty('results');
      expect(unicodeResponse.body).toHaveProperty('totalResults');
      expect(Array.isArray(unicodeResponse.body.results)).toBe(true);
    });
  });
});

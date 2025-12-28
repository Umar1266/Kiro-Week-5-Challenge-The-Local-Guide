// ============================================
// Slang Translator Frontend Application
// ============================================

// State management
const state = {
    currentView: 'search',
    currentPage: 1,
    itemsPerPage: 10,
    totalPages: 1,
    previousView: null
};

// DOM Elements
const elements = {
    // Navigation
    navBtns: document.querySelectorAll('.nav-btn'),
    
    // Search View
    searchInput: document.getElementById('search-input'),
    searchBtn: document.getElementById('search-btn'),
    clearBtn: document.getElementById('clear-btn'),
    resultsList: document.getElementById('results-list'),
    noResults: document.getElementById('no-results'),
    searchError: document.getElementById('search-error'),
    
    // Browse View
    browseList: document.getElementById('browse-list'),
    termCountDisplay: document.getElementById('term-count-display'),
    prevBtn: document.getElementById('prev-btn'),
    nextBtn: document.getElementById('next-btn'),
    pageDisplay: document.getElementById('page-display'),
    browseError: document.getElementById('browse-error'),
    
    // Term Detail View
    termDetail: document.getElementById('term-detail'),
    backBtn: document.getElementById('back-btn'),
    termError: document.getElementById('term-error'),
    
    // Views
    views: document.querySelectorAll('.view')
};

// ============================================
// View Management
// ============================================

function switchView(viewName) {
    // Hide all views
    elements.views.forEach(view => view.classList.remove('active'));
    
    // Show selected view
    const viewElement = document.getElementById(`${viewName}-view`);
    if (viewElement) {
        viewElement.classList.add('active');
    }
    
    // Update navigation buttons
    elements.navBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.view === viewName) {
            btn.classList.add('active');
        }
    });
    
    state.currentView = viewName;
    
    // Load data if needed
    if (viewName === 'browse' && state.currentPage === 1) {
        loadBrowseData();
    }
}

function goToDetailView(termId) {
    state.previousView = state.currentView;
    switchView('term-detail');
    loadTermDetail(termId);
}

function goBack() {
    if (state.previousView) {
        switchView(state.previousView);
    } else {
        switchView('search');
    }
}

// ============================================
// Search Functionality
// ============================================

async function performSearch() {
    const query = elements.searchInput.value.trim();
    
    // Clear previous results
    elements.resultsList.innerHTML = '';
    elements.noResults.style.display = 'none';
    elements.searchError.style.display = 'none';
    
    if (!query) {
        elements.searchError.textContent = 'Please enter a search term';
        elements.searchError.style.display = 'block';
        return;
    }
    
    try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Search failed');
        }
        
        if (data.results.length === 0) {
            elements.noResults.style.display = 'block';
            return;
        }
        
        // Display results
        data.results.forEach(term => {
            const resultItem = createResultItem(term);
            elements.resultsList.appendChild(resultItem);
        });
    } catch (error) {
        console.error('Search error:', error);
        elements.searchError.textContent = error.message || 'An error occurred while searching';
        elements.searchError.style.display = 'block';
    }
}

function createResultItem(term) {
    const item = document.createElement('div');
    item.className = 'result-item';
    item.style.cursor = 'pointer';
    
    const termName = document.createElement('div');
    termName.className = 'result-term';
    termName.textContent = term.term;
    
    const definition = document.createElement('div');
    definition.className = 'result-definition';
    definition.textContent = term.definition;
    
    const preview = document.createElement('div');
    preview.className = 'result-preview';
    if (term.usageExamples && term.usageExamples.length > 0) {
        preview.textContent = `Example: "${term.usageExamples[0].example}"`;
    }
    
    item.appendChild(termName);
    item.appendChild(definition);
    if (preview.textContent) {
        item.appendChild(preview);
    }
    
    item.addEventListener('click', () => goToDetailView(term.id));
    
    return item;
}

function clearSearch() {
    elements.searchInput.value = '';
    elements.resultsList.innerHTML = '';
    elements.noResults.style.display = 'none';
    elements.searchError.style.display = 'none';
    elements.searchInput.focus();
}

// ============================================
// Browse Functionality
// ============================================

async function loadBrowseData() {
    elements.browseList.innerHTML = '';
    elements.browseError.style.display = 'none';
    
    try {
        const response = await fetch(
            `/api/browse?page=${state.currentPage}&limit=${state.itemsPerPage}`
        );
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Browse failed');
        }
        
        // Update term count
        elements.termCountDisplay.textContent = `Total Terms: ${data.totalItems}`;
        
        // Update page display
        elements.pageDisplay.textContent = `Page ${data.page} of ${data.totalPages}`;
        
        // Update pagination buttons
        elements.prevBtn.disabled = data.page === 1;
        elements.nextBtn.disabled = data.page === data.totalPages;
        
        state.totalPages = data.totalPages;
        
        // Display terms
        data.items.forEach(term => {
            const browseItem = createBrowseItem(term);
            elements.browseList.appendChild(browseItem);
        });
    } catch (error) {
        console.error('Browse error:', error);
        elements.browseError.textContent = error.message || 'An error occurred while browsing';
        elements.browseError.style.display = 'block';
    }
}

function createBrowseItem(term) {
    const item = document.createElement('div');
    item.className = 'browse-item';
    item.style.cursor = 'pointer';
    
    const termName = document.createElement('div');
    termName.className = 'browse-term';
    termName.textContent = term.term;
    
    const definition = document.createElement('div');
    definition.className = 'browse-definition';
    definition.textContent = term.definition;
    
    item.appendChild(termName);
    item.appendChild(definition);
    
    item.addEventListener('click', () => goToDetailView(term.id));
    
    return item;
}

function goToPreviousPage() {
    if (state.currentPage > 1) {
        state.currentPage--;
        loadBrowseData();
    }
}

function goToNextPage() {
    if (state.currentPage < state.totalPages) {
        state.currentPage++;
        loadBrowseData();
    }
}

// ============================================
// Term Detail Functionality
// ============================================

async function loadTermDetail(termId) {
    elements.termDetail.innerHTML = '';
    elements.termError.style.display = 'none';
    
    try {
        const response = await fetch(`/api/term/${termId}`);
        const term = await response.json();
        
        if (!response.ok) {
            throw new Error(term.error || 'Term not found');
        }
        
        // Display term details
        const detailContent = createTermDetailContent(term);
        elements.termDetail.appendChild(detailContent);
    } catch (error) {
        console.error('Term detail error:', error);
        elements.termError.textContent = error.message || 'An error occurred while loading term details';
        elements.termError.style.display = 'block';
    }
}

function createTermDetailContent(term) {
    const container = document.createElement('div');
    
    // Term name
    const termNameSection = document.createElement('div');
    termNameSection.className = 'detail-term';
    termNameSection.textContent = term.term;
    container.appendChild(termNameSection);
    
    // Definition section
    const definitionSection = document.createElement('div');
    definitionSection.className = 'detail-section';
    const defTitle = document.createElement('h3');
    defTitle.textContent = 'Definition';
    const defText = document.createElement('div');
    defText.className = 'detail-definition';
    defText.textContent = term.definition;
    definitionSection.appendChild(defTitle);
    definitionSection.appendChild(defText);
    container.appendChild(definitionSection);
    
    // Usage examples section
    if (term.usageExamples && term.usageExamples.length > 0) {
        const examplesSection = document.createElement('div');
        examplesSection.className = 'detail-section';
        const exTitle = document.createElement('h3');
        exTitle.textContent = 'Usage Examples';
        examplesSection.appendChild(exTitle);
        
        const examplesContainer = document.createElement('div');
        examplesContainer.className = 'detail-examples';
        
        term.usageExamples.forEach(example => {
            const exItem = document.createElement('div');
            exItem.className = 'example-item';
            
            const exText = document.createElement('div');
            exText.className = 'example-text';
            exText.textContent = `"${example.example}"`;
            exItem.appendChild(exText);
            
            if (example.context) {
                const exContext = document.createElement('div');
                exContext.className = 'example-context';
                exContext.textContent = `Context: ${example.context}`;
                exItem.appendChild(exContext);
            }
            
            examplesContainer.appendChild(exItem);
        });
        
        examplesSection.appendChild(examplesContainer);
        container.appendChild(examplesSection);
    }
    
    // Cultural context section
    if (term.culturalContext) {
        const contextSection = document.createElement('div');
        contextSection.className = 'detail-section';
        const ctxTitle = document.createElement('h3');
        ctxTitle.textContent = 'Cultural Context';
        contextSection.appendChild(ctxTitle);
        
        const contextContainer = document.createElement('div');
        contextContainer.className = 'detail-context';
        
        if (term.culturalContext.ageGroup) {
            const ageItem = document.createElement('div');
            ageItem.className = 'context-item';
            const ageLabel = document.createElement('div');
            ageLabel.className = 'context-label';
            ageLabel.textContent = 'Age Group';
            const ageValue = document.createElement('div');
            ageValue.className = 'context-value';
            ageValue.textContent = term.culturalContext.ageGroup;
            ageItem.appendChild(ageLabel);
            ageItem.appendChild(ageValue);
            contextContainer.appendChild(ageItem);
        }
        
        if (term.culturalContext.socialSetting) {
            const settingItem = document.createElement('div');
            settingItem.className = 'context-item';
            const settingLabel = document.createElement('div');
            settingLabel.className = 'context-label';
            settingLabel.textContent = 'Social Setting';
            const settingValue = document.createElement('div');
            settingValue.className = 'context-value';
            settingValue.textContent = term.culturalContext.socialSetting;
            settingItem.appendChild(settingLabel);
            settingItem.appendChild(settingValue);
            contextContainer.appendChild(settingItem);
        }
        
        if (term.culturalContext.regionSpecificity) {
            const regionItem = document.createElement('div');
            regionItem.className = 'context-item';
            const regionLabel = document.createElement('div');
            regionLabel.className = 'context-label';
            regionLabel.textContent = 'Region';
            const regionValue = document.createElement('div');
            regionValue.className = 'context-value';
            regionValue.textContent = term.culturalContext.regionSpecificity;
            regionItem.appendChild(regionLabel);
            regionItem.appendChild(regionValue);
            contextContainer.appendChild(regionItem);
        }
        
        if (term.culturalContext.additionalNotes) {
            const notesItem = document.createElement('div');
            notesItem.className = 'context-item';
            const notesLabel = document.createElement('div');
            notesLabel.className = 'context-label';
            notesLabel.textContent = 'Additional Notes';
            const notesValue = document.createElement('div');
            notesValue.className = 'context-value';
            notesValue.textContent = term.culturalContext.additionalNotes;
            notesItem.appendChild(notesLabel);
            notesItem.appendChild(notesValue);
            contextContainer.appendChild(notesItem);
        }
        
        contextSection.appendChild(contextContainer);
        container.appendChild(contextSection);
    }
    
    // Formal translation section
    if (term.formalTranslation) {
        const translationSection = document.createElement('div');
        translationSection.className = 'detail-section detail-translation';
        const transLabel = document.createElement('div');
        transLabel.className = 'translation-label';
        transLabel.textContent = 'Formal Translation';
        const transText = document.createElement('div');
        transText.className = 'translation-text';
        transText.textContent = term.formalTranslation;
        translationSection.appendChild(transLabel);
        translationSection.appendChild(transText);
        container.appendChild(translationSection);
    }
    
    return container;
}

// ============================================
// Event Listeners
// ============================================

// Navigation
elements.navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const viewName = btn.dataset.view;
        switchView(viewName);
    });
});

// Search
elements.searchBtn.addEventListener('click', performSearch);
elements.clearBtn.addEventListener('click', clearSearch);
elements.searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        performSearch();
    }
});

// Browse
elements.prevBtn.addEventListener('click', goToPreviousPage);
elements.nextBtn.addEventListener('click', goToNextPage);

// Term Detail
elements.backBtn.addEventListener('click', goBack);

// ============================================
// Initialization
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Set initial view to search
    switchView('search');
    
    // Focus search input
    elements.searchInput.focus();
});

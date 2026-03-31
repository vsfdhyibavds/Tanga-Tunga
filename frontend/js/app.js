/**
 * App Initialization Module
 * Handles window.onload and app startup
 */

console.log('Script modules loading...');

function bindUIActions() {
    document.querySelectorAll('.get-started-btn').forEach(button => {
        const target = button.dataset.target || 'login';
        button.addEventListener('click', () => goToAuth(target));
    });

    document.querySelectorAll('.logout-btn').forEach(button => {
        button.addEventListener('click', logout);
    });

    const backToHomeBtn = document.getElementById('backToHomeBtn');
    if (backToHomeBtn) {
        backToHomeBtn.addEventListener('click', goToHome);
    }

    const loginTabButton = document.getElementById('loginTabButton');
    const registerTabButton = document.getElementById('registerTabButton');
    if (loginTabButton) {
        loginTabButton.addEventListener('click', () => switchTab('login'));
    }
    if (registerTabButton) {
        registerTabButton.addEventListener('click', () => switchTab('register'));
    }

    document.querySelectorAll('.toggle-password').forEach(button => {
        const inputId = button.dataset.toggle;
        if (inputId) {
            button.addEventListener('click', () => togglePassword(inputId));
        }
    });

    const loginSubmitBtn = document.getElementById('loginSubmitBtn');
    if (loginSubmitBtn) {
        loginSubmitBtn.addEventListener('click', login);
    }

    const registerSubmitBtn = document.getElementById('registerSubmitBtn');
    if (registerSubmitBtn) {
        registerSubmitBtn.addEventListener('click', register);
    }

    const createEventBtn = document.getElementById('createEventBtn');
    if (createEventBtn) {
        createEventBtn.addEventListener('click', showCreateEvent);
    }

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filterEvents);
    }

    document.querySelectorAll('.filter-btn').forEach(button => {
        const category = button.dataset.category;
        if (category) {
            button.addEventListener('click', () => filterByCategory(category, button));
        }
    });

    document.querySelectorAll('[data-event-view]').forEach(button => {
        const view = button.dataset.eventView;
        if (view) {
            button.addEventListener('click', () => showEventView(view));
        }
    });

    const prevMonthBtn = document.getElementById('prevMonthBtn');
    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            calendarViewDate = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() - 1, 1);
            renderCalendar(currentEvents.length ? currentEvents : sampleEvents);
        });
    }

    const nextMonthBtn = document.getElementById('nextMonthBtn');
    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            calendarViewDate = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + 1, 1);
            renderCalendar(currentEvents.length ? currentEvents : sampleEvents);
        });
    }

    document.querySelectorAll('.modal-close').forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal');
            if (modal) {
                modal.classList.remove('active');
            }
        });
    });

    const createEventSubmitBtn = document.getElementById('createEventSubmitBtn');
    if (createEventSubmitBtn) {
        createEventSubmitBtn.addEventListener('click', handleCreateEvent);
    }
}

// Initialize app with security checks
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOMContentLoaded executing...');

    // Verify security environment
    checkSecurityHeaders();

    // Restore authentication state from storage or refresh from API
    if (typeof loadCurrentUserFromStorage === 'function') {
        await loadCurrentUserFromStorage();
    }

    // Set up form handlers and bind UI actions
    setupFormHandlers();
    bindUIActions();

    // Add event listeners to Get Started buttons for interactive readiness
    const getStartedButtons = document.querySelectorAll('.get-started-btn');
    console.log('Found', getStartedButtons.length, 'Get Started buttons');

    getStartedButtons.forEach((btn, index) => {
        console.log(`Configuring Get Started button ${index + 1}`);
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.visibility = 'visible';
        btn.style.pointerEvents = 'auto';
    });

    // Clear any sensitive data from URL
    window.history.replaceState({}, document.title, window.location.pathname);

    if (isAuthenticated()) {
        await showDashboard();
    } else {
        goToHome();
    }

    console.log('DOMContentLoaded complete!');
});

console.log('App initialization module loaded successfully!');

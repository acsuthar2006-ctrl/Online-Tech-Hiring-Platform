/**
 * Centralized Routing and Authentication Guard
 */

const PUBLIC_PATHS = [
    '/login/login.html',
    '/login/signup.html',
    '/index.html', // Landing/Redirect handler
    '/'
];

export class Router {
    static init() {
        this.checkAuth();
    }

    static checkAuth() {
        const path = window.location.pathname;
        const isLoggedIn = sessionStorage.getItem('jwt_token');
        const role = sessionStorage.getItem('userRole'); // We should store this cleanly

        // 1. Allow public paths
        if (PUBLIC_PATHS.some(p => path.endsWith(p))) {
            return;
        }

        // 2. Allow Lobby (Special case, might be public or protected, but usually requires just link)
        if (path.includes('lobby.html')) {
            return;
        }

        // 3. Protected Routes
        if (!isLoggedIn) {
            console.warn('Unauthorized access. Redirecting to login.');
            window.location.href = '/login/login.html';
            return;
        }

        // 4. Role Guard
        if (role === 'CANDIDATE' && path.includes('/interviewer/')) {
            window.location.href = '/candidate/candidate-dashboard.html';
        } else if (role === 'INTERVIEWER' && path.includes('/candidate/')) {
            window.location.href = '/interviewer/interviewer-dashboard.html';
        }
    }

    static navigateTo(path) {
        window.location.href = path;
    }
}

// Auto-run on import
Router.init();

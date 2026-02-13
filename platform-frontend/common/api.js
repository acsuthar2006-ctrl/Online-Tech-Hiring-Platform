// API service for backend communication
// Backend uses JWT tokens with Bearer authentication
const API_BASE_URL = '/api';
const TOKEN_KEY = 'jwt_token';
const TOKEN_EXPIRY_KEY = 'jwt_token_expiry';

class ApiService {
  constructor() {
    this.token = localStorage.getItem(TOKEN_KEY);
    this.checkTokenExpiry();
  }

  // Store JWT token after successful login
  setToken(token) {
    this.token = token;
    localStorage.setItem(TOKEN_KEY, token);
    // Token expiry: 24 hours from now
    const expiryTime = new Date().getTime() + 86400000; // 24 hours in ms
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime);
  }

  // Clear token on logout or expiry
  clearToken() {
    this.token = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
  }

  // Check if token has expired
  checkTokenExpiry() {
    const expiryTime = localStorage.getItem(TOKEN_EXPIRY_KEY);
    if (!expiryTime) return;

    if (new Date().getTime() > parseInt(expiryTime)) {
      console.warn('JWT token expired');
      this.clearToken();
      window.location.href = '../login/login.html';
    }
  }

  // Get Authorization header with Bearer token
  getAuthHeader() {
    if (!this.token) {
      return null;
    }
    return `Bearer ${this.token}`;
  }

  // Helper method for all requests
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add Bearer token if available
    const authHeader = this.getAuthHeader();
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle non-200 responses
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorMessage = `HTTP ${response.status}`;

        // Try to parse error response
        if (contentType && contentType.includes('application/json')) {
          try {
            const error = await response.json();
            errorMessage = error.message || error || errorMessage;
          } catch (e) {
            // Failed to parse JSON, use generic message
          }
        }

        // 401 Unauthorized - redirect to login
        if (response.status === 401) {
          this.clearToken();
          window.location.href = '../login/login.html';
        }

        throw new Error(errorMessage);
      }

      // For successful responses without content, return null
      const contentLength = response.headers.get('content-length');
      if (response.status === 204 || !contentLength) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // ===== AUTH ENDPOINTS =====
  async signup(email, password, fullName, role, additionalData = {}) {
    const payload = {
      email,
      password,
      fullName,
      role: role.toUpperCase(), // Backend expects CANDIDATE or INTERVIEWER
      ...additionalData, // resumeUrl, skills for candidate; companyName for interviewer
    };

    const data = await this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    // Signup doesn't return token, user must login after
    return data; // Returns: { token: null, message, userId, role, fullName }
  }

  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    // Login returns JWT token - store it for future requests
    if (data.token) {
      this.setToken(data.token);
    }
    return data; // Returns: { token, message, userId, role, fullName }
  }

  // ===== USER ENDPOINTS =====
  async getUserProfile() {
    return this.request('/users/profile');
  }

  // ===== COMPANY ENDPOINTS =====
  async getAllCompanies() {
    return this.request('/companies');
  }

  // ===== POSITION ENDPOINTS =====
  async getAllPositions() {
    return this.request('/positions');
  }

  async getPositionsByCompany(companyId) {
    return this.request(`/positions/company/${companyId}`);
  }

  async getInterviewerExpertise(interviewerId) {
    return this.request(`/interviewers/${interviewerId}/expertise`);
  }



  // ===== INTERVIEW ENDPOINTS (No auth required) =====
  async getUpcomingInterviews(email) {
    return this.request(`/interviews/candidate/upcoming?email=${encodeURIComponent(email)}`);
  }

  async getUpcomingInterviewsForInterviewer(email) {
    return this.request(`/interviews/interviewer/upcoming?email=${encodeURIComponent(email)}`);
  }

  async scheduleInterview(data) {
    return this.request('/interviews/schedule', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getSessionQueue(meetingLink) {
    return this.request(`/interviews/session/${encodeURIComponent(meetingLink)}/queue`);
  }

  async startInterview(id) {
    return this.request(`/interviews/${id}/start`, { method: 'POST' });
  }

  async completeInterview(id) {
    return this.request(`/interviews/${id}/complete`, { method: 'POST' });
  }

  async getInterviewStatus(id) {
    return this.request(`/interviews/${id}/status`);
  }

  async sendManualReminder(id) {
    return this.request(`/interviews/${id}/remind`, { method: 'POST' });
  }
}

export const api = new ApiService();

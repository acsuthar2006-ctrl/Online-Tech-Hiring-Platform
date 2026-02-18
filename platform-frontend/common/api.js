// API service for backend communication
// Backend uses JWT tokens with Bearer authentication
const API_BASE_URL = '/api';
const TOKEN_KEY = 'jwt_token';
const USER_INFO_KEY = 'user_info'; 

class ApiService {
  constructor() {
    this.token = sessionStorage.getItem(TOKEN_KEY);
  }

  // Store JWT token after successful login
  setToken(token) {
    this.token = token;
    sessionStorage.setItem(TOKEN_KEY, token);
  }
  
  // Store user info
  setUserInfo(user) {
      sessionStorage.setItem(USER_INFO_KEY, JSON.stringify(user));
  }

  getUserInfo() {
      const data = sessionStorage.getItem(USER_INFO_KEY);
      return data ? JSON.parse(data) : null;
  }

  // Clear token on logout or expiry
  clearToken() {
    this.token = null;
    sessionStorage.clear(); // Clear everything
  }

  // Get Authorization header with Bearer token
  getAuthHeader() {
    if (!this.token) {
      this.token = sessionStorage.getItem(TOKEN_KEY); 
    }
    return this.token ? `Bearer ${this.token}` : null;
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
          window.location.href = '/login/login.html';
        }

        throw new Error(errorMessage);
      }

      // For successful responses without content, return null
      if (response.status === 204) {
        return null;
      }

      const text = await response.text();
      return text ? JSON.parse(text) : null;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // ===== AUTH ENDPOINTS =====
  async signup(email, password, fullName, role, additionalData = {}) {
    // Force role to uppercase to match backend enum
    const payload = {
      email,
      password,
      fullName,
      role: role ? role.toUpperCase() : 'CANDIDATE',
      ...additionalData,
    };

    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    // Login returns JWT token - store it for future requests
    if (data && data.token) {
      this.setToken(data.token);
      // Store basic user info if returned
      if (data.userId) {
          this.setUserInfo({
              id: data.userId,
              email: email, 
              role: data.role,
              fullName: data.fullName
          });
      }
    }
    return data; 
  }

  // ===== USER ENDPOINTS =====
  async getUserProfile() {
    return this.request('/users/profile');
  }

  async updateUserProfile(data) {
      return this.request('/users/profile', {
          method: 'PUT',
          body: JSON.stringify(data)
      });
  }

  // ===== SETTINGS ENDPOINTS =====
  async getCandidateSettings(candidateId) {
      return this.request(`/settings/candidate/${candidateId}`);
  }

  async updateCandidateSettings(candidateId, settings) {
      return this.request(`/settings/candidate/${candidateId}`, {
          method: 'PUT',
          body: JSON.stringify(settings)
      });
  }

  async getInterviewerSettings(interviewerId) {
      return this.request(`/settings/interviewer/${interviewerId}`);
  }

  async updateInterviewerSettings(interviewerId, settings) {
      return this.request(`/settings/interviewer/${interviewerId}`, {
          method: 'PUT',
          body: JSON.stringify(settings)
      });
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
    // data should match ScheduleRequest DTO
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

  async getRecordings(interviewId) {
    return this.request(`/recordings/${interviewId}`);
  }
}

export const api = new ApiService();

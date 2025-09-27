/**
 * Kisaan Connect API Client
 * Handles all API calls from frontend to backend/Atlas
 */

class KisaanAPI {
  constructor() {
    this.baseURL = '';  // Since we're serving from the same domain
    this.defaultHeaders = {
      'Content-Type': 'application/json'
    };
  }

  // ===== AUTHENTICATION METHODS =====
  
  async login(phoneNumber, password) {
    try {
      const response = await fetch('/login', {
        method: 'POST',
        headers: this.defaultHeaders,
        credentials: 'include',
        body: JSON.stringify({ phoneNumber, password })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Login failed');
      }
      
      return result;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async register(formData) {
    try {
      const response = await fetch('/register', {
        method: 'POST',
        credentials: 'include',
        body: formData  // FormData for file uploads
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Registration failed');
      }
      
      return result;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async logout() {
    try {
      const response = await fetch('/logout', {
        method: 'GET',
        credentials: 'include'
      });
      
      if (response.ok) {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  async getCurrentUser() {
    try {
      const response = await fetch('/user', {
        method: 'GET',
        credentials: 'include'
      });
      
      if (response.ok) {
        return await response.json();
      }
      
      return null;
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  }

  async checkAdminStatus() {
    try {
      const response = await fetch('/api/user/admin-check', {
        method: 'GET',
        credentials: 'include'
      });
      
      if (response.ok) {
        return await response.json();
      }
      
      return { isAdmin: false };
    } catch (error) {
      console.error('Admin check error:', error);
      return { isAdmin: false };
    }
  }

  // ===== FARMER/USER DATA METHODS =====
  
  async getFarmers(params = {}) {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await fetch(`/api/farmers?${queryParams}`, {
        method: 'GET',
        headers: this.defaultHeaders,
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch farmers');
      }
      
      return result;
    } catch (error) {
      console.error('Get farmers error:', error);
      throw error;
    }
  }

  async getFarmer(id) {
    try {
      const response = await fetch(`/api/farmers/${id}`, {
        method: 'GET',
        headers: this.defaultHeaders,
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch farmer');
      }
      
      return result;
    } catch (error) {
      console.error('Get farmer error:', error);
      throw error;
    }
  }

  async getProfile() {
    try {
      const response = await fetch('/api/profile', {
        method: 'GET',
        headers: this.defaultHeaders,
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch profile');
      }
      
      return result;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  }

  async updateProfile(profileData) {
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: this.defaultHeaders,
        credentials: 'include',
        body: JSON.stringify(profileData)
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update profile');
      }
      
      return result;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  // ===== CROP DATA METHODS =====
  
  async getCrops(params = {}) {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await fetch(`/crops?${queryParams}`, {
        method: 'GET',
        headers: this.defaultHeaders,
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch crops');
      }
      
      return result;
    } catch (error) {
      console.error('Get crops error:', error);
      throw error;
    }
  }

  async getCrop(id) {
    try {
      const response = await fetch(`/crops/${id}`, {
        method: 'GET',
        headers: this.defaultHeaders,
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch crop');
      }
      
      return result;
    } catch (error) {
      console.error('Get crop error:', error);
      throw error;
    }
  }

  async addCrop(formData) {
    try {
      const response = await fetch('/crops', {
        method: 'POST',
        credentials: 'include',
        body: formData  // FormData for file uploads
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to add crop');
      }
      
      return result;
    } catch (error) {
      console.error('Add crop error:', error);
      throw error;
    }
  }

  async updateCrop(id, formData) {
    try {
      const response = await fetch(`/crops/${id}`, {
        method: 'PUT',
        credentials: 'include',
        body: formData  // FormData for file uploads
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update crop');
      }
      
      return result;
    } catch (error) {
      console.error('Update crop error:', error);
      throw error;
    }
  }

  async deleteCrop(id) {
    try {
      const response = await fetch(`/crops/${id}`, {
        method: 'DELETE',
        headers: this.defaultHeaders,
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete crop');
      }
      
      return result;
    } catch (error) {
      console.error('Delete crop error:', error);
      throw error;
    }
  }

  async getCropSuggestions(query) {
    try {
      const response = await fetch(`/crops/search/suggestions?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: this.defaultHeaders,
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to get suggestions');
      }
      
      return result.suggestions || [];
    } catch (error) {
      console.error('Get crop suggestions error:', error);
      return [];
    }
  }

  // ===== SUPPORT/HELP METHODS =====
  
  async submitSupportTicket(ticketData) {
    try {
      const response = await fetch('/api/help/tickets', {
        method: 'POST',
        headers: this.defaultHeaders,
        credentials: 'include',
        body: JSON.stringify(ticketData)
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit support ticket');
      }
      
      return result;
    } catch (error) {
      console.error('Submit support ticket error:', error);
      throw error;
    }
  }

  async getSupportTickets(params = {}) {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await fetch(`/api/help/tickets?${queryParams}`, {
        method: 'GET',
        headers: this.defaultHeaders,
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch support tickets');
      }
      
      return result;
    } catch (error) {
      console.error('Get support tickets error:', error);
      throw error;
    }
  }

  async getSupportStats() {
    try {
      const response = await fetch('/api/help/stats', {
        method: 'GET',
        headers: this.defaultHeaders,
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch support stats');
      }
      
      return result;
    } catch (error) {
      console.error('Get support stats error:', error);
      throw error;
    }
  }

  // ===== DASHBOARD METHODS =====
  
  async getDashboardStats() {
    try {
      const response = await fetch('/api/dashboard/stats', {
        method: 'GET',
        headers: this.defaultHeaders,
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch dashboard stats');
      }
      
      return result;
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      throw error;
    }
  }

  // ===== PASSWORD RESET METHODS =====
  
  async forgotPassword(email) {
    try {
      const response = await fetch('/forgot-password', {
        method: 'POST',
        headers: this.defaultHeaders,
        body: JSON.stringify({ email })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to send reset email');
      }
      
      return result;
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  }

  // ===== UTILITY METHODS =====
  
  async testDatabaseConnection() {
    try {
      const response = await fetch('/api/test/farmers', {
        method: 'GET',
        headers: this.defaultHeaders,
        credentials: 'include'
      });
      
      const result = await response.json();
      
      return {
        success: response.ok,
        data: result,
        status: response.status
      };
    } catch (error) {
      console.error('Database test error:', error);
      return {
        success: false,
        error: error.message,
        status: 500
      };
    }
  }

  // ===== ERROR HANDLING UTILITY =====
  
  handleApiError(error, context = 'API call') {
    console.error(`${context} error:`, error);
    
    // Show user-friendly error messages
    const errorMessage = error.message || 'An unexpected error occurred';
    
    if (error.message.includes('Network')) {
      return '❌ Network error. Please check your connection and try again.';
    } else if (error.message.includes('401') || error.message.includes('Authentication')) {
      return '🔒 Please login to continue.';
    } else if (error.message.includes('403') || error.message.includes('Access denied')) {
      return '🚫 You don\'t have permission to perform this action.';
    } else {
      return `❌ ${errorMessage}`;
    }
  }
}

// Create global instance
const kisaanAPI = new KisaanAPI();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = KisaanAPI;
}

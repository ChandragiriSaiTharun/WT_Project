// Admin authentication and role management
class AdminAuth {
  constructor() {
    this.currentUser = null;
    this.adminUsers = [
      { email: 'admin@kisaanconnect.com', role: 'super_admin' },
      { email: 'support@kisaanconnect.com', role: 'support_admin' },
      { email: 'thanushreddy934@gmail.com', role: 'super_admin' }
    ];
  }

  // Check if current user is logged in
  async checkAuthentication() {
    try {
      const response = await fetch('/user', {
        method: 'GET',
        credentials: 'include'
      });
      
      if (response.ok) {
        const user = await response.json();
        this.currentUser = user;
        return user;
      }
      return null;
    } catch (error) {
      console.error('Authentication check failed:', error);
      return null;
    }
  }

  // Check if user has admin privileges
  isAdmin(email = null) {
    const userEmail = email || (this.currentUser && this.currentUser.email);
    if (!userEmail) return false;
    
    return this.adminUsers.some(admin => admin.email.toLowerCase() === userEmail.toLowerCase());
  }

  // Get admin role
  getAdminRole(email = null) {
    const userEmail = email || (this.currentUser && this.currentUser.email);
    if (!userEmail) return null;
    
    const admin = this.adminUsers.find(admin => admin.email.toLowerCase() === userEmail.toLowerCase());
    return admin ? admin.role : null;
  }

  // Check specific permissions
  hasPermission(permission) {
    const role = this.getAdminRole();
    if (!role) return false;

    const permissions = {
      'super_admin': ['view_all_tickets', 'manage_users', 'delete_tickets', 'system_config'],
      'support_admin': ['view_all_tickets', 'respond_tickets', 'close_tickets']
    };

    return permissions[role] && permissions[role].includes(permission);
  }

  // Initialize admin interface
  async initializeAdminInterface() {
    const user = await this.checkAuthentication();
    
    if (!user) {
      this.redirectToLogin();
      return false;
    }

    if (!this.isAdmin()) {
      this.showAccessDenied();
      return false;
    }

    this.showAdminPanel();
    return true;
  }

  // Redirect to login page
  redirectToLogin() {
    window.location.href = '/Login.html';
  }

  // Show access denied message
  showAccessDenied() {
    document.body.innerHTML = `
      <div class="container mt-5">
        <div class="alert alert-danger text-center">
          <h2>Access Denied</h2>
          <p>You don't have administrator privileges to access this page.</p>
          <a href="/marketplace" class="btn btn-primary">Go to Marketplace</a>
        </div>
      </div>
    `;
  }

  // Show admin panel elements
  showAdminPanel() {
    // Show admin-only elements
    document.querySelectorAll('.admin-only').forEach(element => {
      element.style.display = 'block';
    });

    // Hide non-admin elements
    document.querySelectorAll('.non-admin').forEach(element => {
      element.style.display = 'none';
    });

    // Add admin badge
    this.addAdminBadge();
  }

  // Add visual admin badge
  addAdminBadge() {
    const badge = document.createElement('div');
    badge.className = 'admin-badge';
    badge.innerHTML = `
      <div class="alert alert-info position-fixed" style="top: 10px; right: 10px; z-index: 1000;">
        <i class="fas fa-shield-alt"></i> Admin Mode
        <small class="d-block">${this.getAdminRole()}</small>
      </div>
    `;
    document.body.appendChild(badge);
  }
}

// Global admin auth instance
const adminAuth = new AdminAuth();

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  // Only initialize admin interface if on admin page
  if (window.location.pathname.includes('admin') || document.body.classList.contains('admin-page')) {
    adminAuth.initializeAdminInterface();
  }
});

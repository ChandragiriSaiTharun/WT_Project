// Auto-redirect admin users to admin help page
(function() {
    // Function to check if user is admin
    async function checkAdminStatus() {
        try {
            const response = await fetch('/api/user/admin-check', {
                method: 'GET',
                credentials: 'include'
            });
            
            if (response.ok) {
                const result = await response.json();
                return result.isAdmin && result.email === 'thanushreddy934@gmail.com';
            }
        } catch (error) {
            console.log('Error checking admin status:', error);
        }
        return false;
    }

    // Function to handle help link clicks
    async function handleHelpLink(event) {
        const href = event.target.getAttribute('href') || event.target.closest('a').getAttribute('href');
        
        // Check if it's a help-related link
        if (href && (href.includes('help.html') || href.includes('/help'))) {
            const isAdmin = await checkAdminStatus();
            
            if (isAdmin) {
                event.preventDefault();
                
                // Show loading indicator
                const loadingDiv = document.createElement('div');
                loadingDiv.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(46, 125, 50, 0.9);
                    color: white;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    z-index: 10000;
                `;
                loadingDiv.innerHTML = `
                    <i class="fas fa-shield-alt" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                    <h3>Admin Access Detected</h3>
                    <p>Redirecting to Admin Dashboard...</p>
                    <div class="spinner-border text-light mt-3" role="status"></div>
                `;
                document.body.appendChild(loadingDiv);
                
                // Redirect after a short delay
                setTimeout(() => {
                    window.location.href = '/admin-help.html';
                }, 1500);
            }
        }
    }

    // Add event listeners when DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
        // Add click listeners to all existing help links
        document.addEventListener('click', function(event) {
            if (event.target.tagName === 'A' || event.target.closest('a')) {
                handleHelpLink(event);
            }
        });

        // Also handle any buttons or elements that navigate to help
        document.querySelectorAll('[onclick*="help"], [onclick*="Help"]').forEach(element => {
            element.addEventListener('click', handleHelpLink);
        });
    });

    // For dynamic content - observe for new help links
    if (typeof MutationObserver !== 'undefined') {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1) { // Element node
                        const helpLinks = node.querySelectorAll('a[href*="help"]');
                        helpLinks.forEach(link => {
                            link.addEventListener('click', handleHelpLink);
                        });
                    }
                });
            });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
    }
})();

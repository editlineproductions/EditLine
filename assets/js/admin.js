// Admin Dashboard JavaScript

const ADMIN_PASSWORD = 'quentindorel01.';
const MESSAGES_KEY = 'editline_messages';
const AUTH_KEY = 'editline_admin_auth';
const GITHUB_PAGES_EMPTY_STATE = 'GitHub Pages mode: new submissions are sent to Formspree and your email inbox. This list only shows local messages saved in this browser.';

let currentMessageId = null;
let allMessages = [];

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    setupEventListeners();
    loadMessages();
});

// Check Authentication
function checkAuth() {
    const isAuthenticated = localStorage.getItem(AUTH_KEY);
    if (isAuthenticated) {
        showDashboard();
    } else {
        showLogin();
    }
}

// Show Login
function showLogin() {
    document.getElementById('loginScreen').style.display = 'block';
    document.getElementById('dashboardScreen').style.display = 'none';
    
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const password = document.getElementById('password').value;
        
        if (password === ADMIN_PASSWORD) {
            localStorage.setItem(AUTH_KEY, 'true');
            document.getElementById('password').value = '';
            showDashboard();
        } else {
            showNotification('Incorrect password', 'error');
        }
    });
}

// Show Dashboard
function showDashboard() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('dashboardScreen').style.display = 'block';
    updateStats();
    displayMessages();
    loadContentManager();
}

// Setup Event Listeners
function setupEventListeners() {
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', function() {
        localStorage.removeItem(AUTH_KEY);
        location.reload();
    });

    // Refresh
    document.getElementById('refreshBtn').addEventListener('click', function() {
        loadMessages();
        showNotification('Messages refreshed', 'success');
    });

    // Filters
    document.getElementById('serviceFilter').addEventListener('change', filterMessages);
    document.getElementById('statusFilter').addEventListener('change', filterMessages);
    document.getElementById('searchBox').addEventListener('input', filterMessages);

    // Modal Close
    document.querySelector('.close-btn').addEventListener('click', closeModal);
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('messageModal');
        if (event.target === modal) {
            closeModal();
        }
    });

    // Reply Form
    document.getElementById('replyForm').addEventListener('submit', function(e) {
        e.preventDefault();
        sendReply();
    });

    // Mark as Read Button
    document.querySelector('.mark-btn').addEventListener('click', markAsRead);

    // Tab Navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
}

// Load Messages from localStorage
function loadMessages() {
    const stored = localStorage.getItem(MESSAGES_KEY);
    allMessages = stored ? JSON.parse(stored) : [];
}

// Display Messages
function displayMessages() {
    const messagesList = document.getElementById('messagesList');
    
    if (allMessages.length === 0) {
        messagesList.innerHTML = `<p class="empty-state">${GITHUB_PAGES_EMPTY_STATE}</p>`;
        return;
    }

    messagesList.innerHTML = allMessages.map(msg => `
        <div class="message-item ${msg.status === 'unread' ? 'unread' : ''}" onclick="openMessage(${msg.id})">
            <div class="message-avatar">${msg.name.charAt(0).toUpperCase()}</div>
            <div class="message-content">
                <div class="message-header">
                    <div>
                        <div class="message-name">${msg.name}</div>
                        <span class="message-service">${formatService(msg.service)}</span>
                    </div>
                    <div class="message-date">${formatDate(msg.timestamp)}</div>
                </div>
                <div class="message-preview">${msg.message.substring(0, 150)}...</div>
            </div>
            <div class="message-status ${msg.status}">${msg.status.charAt(0).toUpperCase() + msg.status.slice(1)}</div>
        </div>
    `).join('');
}

// Filter Messages
function filterMessages() {
    const service = document.getElementById('serviceFilter').value;
    const status = document.getElementById('statusFilter').value;
    const search = document.getElementById('searchBox').value.toLowerCase();

    const filtered = allMessages.filter(msg => {
        const matchService = !service || msg.service === service;
        const matchStatus = !status || msg.status === status;
        const matchSearch = !search || msg.name.toLowerCase().includes(search) || msg.email.toLowerCase().includes(search);
        return matchService && matchStatus && matchSearch;
    });

    const messagesList = document.getElementById('messagesList');
    if (filtered.length === 0) {
        messagesList.innerHTML = '<p class="empty-state">No local messages match your filters in this browser.</p>';
        return;
    }

    messagesList.innerHTML = filtered.map(msg => `
        <div class="message-item ${msg.status === 'unread' ? 'unread' : ''}" onclick="openMessage(${msg.id})">
            <div class="message-avatar">${msg.name.charAt(0).toUpperCase()}</div>
            <div class="message-content">
                <div class="message-header">
                    <div>
                        <div class="message-name">${msg.name}</div>
                        <span class="message-service">${formatService(msg.service)}</span>
                    </div>
                    <div class="message-date">${formatDate(msg.timestamp)}</div>
                </div>
                <div class="message-preview">${msg.message.substring(0, 150)}...</div>
            </div>
            <div class="message-status ${msg.status}">${msg.status.charAt(0).toUpperCase() + msg.status.slice(1)}</div>
        </div>
    `).join('');
}

// Open Message
function openMessage(id) {
    currentMessageId = id;
    const message = allMessages.find(m => m.id === id);
    
    if (!message) return;

    // Populate modal
    document.getElementById('modalName').textContent = message.name;
    document.getElementById('modalEmail').textContent = message.email;
    document.getElementById('emailLink').href = `mailto:${message.email}`;
    document.getElementById('modalService').textContent = formatService(message.service);
    document.getElementById('modalDate').textContent = new Date(message.timestamp).toLocaleString();
    document.getElementById('modalMessage').textContent = message.message;

    // Clear reply form
    document.getElementById('replyText').value = '';

    // Show replies history
    if (message.replies && message.replies.length > 0) {
        const repliesList = document.getElementById('repliesList');
        repliesList.innerHTML = message.replies.map(reply => `
            <div class="reply-item">
                <div class="reply-date">${new Date(reply.timestamp).toLocaleString()}</div>
                <div class="reply-text">${reply.text}</div>
            </div>
        `).join('');
        document.getElementById('repliesHistory').style.display = 'block';
    } else {
        document.getElementById('repliesHistory').style.display = 'none';
    }

    // Show modal
    document.getElementById('messageModal').classList.add('show');
}

// Close Modal
function closeModal() {
    document.getElementById('messageModal').classList.remove('show');
    document.getElementById('replyForm').reset();
    currentMessageId = null;
}

// Send Reply
function sendReply() {
    const replyText = document.getElementById('replyText').value.trim();
    
    if (!replyText) {
        showNotification('Reply note cannot be empty', 'error');
        return;
    }

    const message = allMessages.find(m => m.id === currentMessageId);
    if (!message) return;

    if (!message.replies) {
        message.replies = [];
    }

    message.replies.push({
        timestamp: new Date().getTime(),
        text: replyText
    });

    if (message.status === 'unread') {
        message.status = 'replied';
    } else {
        message.status = 'replied';
    }

    saveMessages();
    openMessage(currentMessageId);
    updateStats();
    showNotification('Reply note saved locally. No email is sent from this page on GitHub Pages.', 'success');
}

// Mark as Read
function markAsRead() {
    const message = allMessages.find(m => m.id === currentMessageId);
    if (message) {
        message.status = 'read';
        saveMessages();
        updateStats();
        showNotification('Marked as read', 'success');
    }
}

// Update Statistics
function updateStats() {
    const total = allMessages.length;
    const unread = allMessages.filter(m => m.status === 'unread').length;
    const clients = new Set(allMessages.map(m => m.email)).size;

    document.getElementById('totalMessages').textContent = total;
    document.getElementById('newMessages').textContent = unread;
    document.getElementById('totalClients').textContent = clients;
}

// Save Messages to localStorage
function saveMessages() {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(allMessages));
    displayMessages();
}

// Format Service
function formatService(service) {
    const services = {
        video: 'Video Editing',
        audio: 'Audio Editing',
        photo: 'Photo Editing',
        line: 'Line Editing'
    };
    return services[service] || service;
}

// Format Date
function formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    // Less than 1 minute
    if (diff < 60000) return 'Just now';
    // Less than 1 hour
    if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
    // Less than 1 day
    if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
    // Less than 7 days
    if (diff < 604800000) return Math.floor(diff / 86400000) + 'd ago';
    
    return date.toLocaleDateString();
}

// Show Notification
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';

    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Copy Email to Clipboard
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('copy-btn')) {
        e.preventDefault();
        const email = document.getElementById('modalEmail').textContent;
        navigator.clipboard.writeText(email).then(() => {
            showNotification('Email copied to clipboard', 'success');
        });
    }
});

// ========== CONTENT MANAGER ==========

const CONTENT_KEY = 'editline_content';

// Switch Tabs
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    if (tabName === 'content') {
        document.getElementById('contentTab').classList.add('active');
    } else {
        document.getElementById('messagesTab').classList.add('active');
    }

    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
}

// Load Content Manager
function loadContentManager() {
    const content = getStoredContent();
    
    // Hero Section
    const heroTitleEl = document.getElementById('heroTitle');
    const heroSubtitleEl = document.getElementById('heroSubtitle');
    const heroDescriptionEl = document.getElementById('heroDescription');
    
    if (heroTitleEl) heroTitleEl.value = content.heroTitle;
    if (heroSubtitleEl) heroSubtitleEl.value = content.heroSubtitle;
    if (heroDescriptionEl) heroDescriptionEl.value = content.heroDescription;

    // Portfolio
    renderPortfolioItems(content.portfolio);

    // Services
    renderServiceItems(content.services);
}

// Get Stored Content
function getStoredContent() {
    const stored = localStorage.getItem(CONTENT_KEY);
    return stored ? JSON.parse(stored) : {
        heroTitle: 'Professional Editing Services',
        heroSubtitle: 'Video • Audio • Photo • Line Editing',
        heroDescription: 'Transform your content with professional-grade editing expertise',
        portfolio: [
            { id: 1, title: 'Commercial Production', description: '30-second commercial for major brand' },
            { id: 2, title: 'Documentary Series', description: 'Full post-production for 5-part series' },
            { id: 3, title: 'Music Video', description: 'Professional music video production' },
            { id: 4, title: 'Podcast Series', description: 'Audio post-production for 50+ episodes' }
        ],
        services: [
            { id: 1, name: 'Video Editing', description: 'Professional video editing for commercials, documentaries, social media content, and more. Color correction, motion graphics, and sound design included.' },
            { id: 2, name: 'Audio Editing', description: 'High-quality audio post-production including mixing, mastering, noise reduction, and ADR. Perfect for films, podcasts, and music projects.' },
            { id: 3, name: 'Photo Editing', description: 'Retouching, color grading, background removal, and batch processing. Enhance your images for portfolios, marketing, and publications.' },
            { id: 4, name: 'Line Editing', description: 'Professional content review focusing on narrative flow, clarity, and style. Perfect for scripts, documentaries, and educational content.' }
        ]
    };
}

// Render Portfolio Items
function renderPortfolioItems(portfolio) {
    const container = document.getElementById('portfolioItems');
    if (!container) return;
    
    container.innerHTML = '';

    portfolio.forEach(item => {
        const formHTML = `
            <div class="portfolio-item-form" data-portfolio-id="${item.id}">
                <h4>
                    <span>${item.title}</span>
                    <button type="button" class="remove-btn" onclick="removePortfolioItem(${item.id})">Remove</button>
                </h4>
                <div class="form-group">
                    <label>Title</label>
                    <input type="text" class="content-input portfolio-title" value="${item.title}" placeholder="Project title">
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea class="content-input portfolio-desc" placeholder="Project description">${item.description}</textarea>
                </div>
                <div class="form-group">
                    <label>Image URL</label>
                    <input type="text" class="content-input portfolio-image" value="${item.image || ''}" placeholder="https://...">
                </div>
            </div>
        `;
        container.innerHTML += formHTML;
    });
}

// Render Service Items
function renderServiceItems(services) {
    const container = document.getElementById('serviceItems');
    if (!container) return;
    
    container.innerHTML = '';

    services.forEach((service, index) => {
        const formHTML = `
            <div class="content-section" style="border: 1px solid var(--border-color); padding: 1rem; background-color: var(--light-bg);">
                <h4>${service.name}</h4>
                <div class="form-group">
                    <label>Description</label>
                    <textarea class="content-input service-desc" data-service-index="${index}" placeholder="Service description">${service.description}</textarea>
                </div>
            </div>
        `;
        container.innerHTML += formHTML;
    });
}

// Add Portfolio Item
function addPortfolioItem() {
    const content = getStoredContent();
    const newId = Math.max(...content.portfolio.map(p => p.id), 0) + 1;
    content.portfolio.push({
        id: newId,
        title: 'New Project',
        description: 'Project description',
        image: ''
    });
    renderPortfolioItems(content.portfolio);
}

// Remove Portfolio Item
function removePortfolioItem(id) {
    if (confirm('Remove this portfolio item?')) {
        const content = getStoredContent();
        content.portfolio = content.portfolio.filter(p => p.id !== id);
        renderPortfolioItems(content.portfolio);
    }
}

// Save Content
function saveContent() {
    const content = getStoredContent();

    // Hero Section
    const heroTitleEl = document.getElementById('heroTitle');
    const heroSubtitleEl = document.getElementById('heroSubtitle');
    const heroDescriptionEl = document.getElementById('heroDescription');
    
    if (heroTitleEl) content.heroTitle = heroTitleEl.value;
    if (heroSubtitleEl) content.heroSubtitle = heroSubtitleEl.value;
    if (heroDescriptionEl) content.heroDescription = heroDescriptionEl.value;

    // Portfolio
    content.portfolio = [];
    document.querySelectorAll('.portfolio-item-form').forEach(form => {
        content.portfolio.push({
            id: parseInt(form.getAttribute('data-portfolio-id')),
            title: form.querySelector('.portfolio-title').value,
            description: form.querySelector('.portfolio-desc').value,
            image: form.querySelector('.portfolio-image').value
        });
    });

    // Services
    content.services = [];
    document.querySelectorAll('.service-desc').forEach(input => {
        const index = parseInt(input.getAttribute('data-service-index'));
        if (!content.services[index]) {
            content.services[index] = getStoredContent().services[index];
        }
        content.services[index].description = input.value;
    });

    localStorage.setItem(CONTENT_KEY, JSON.stringify(content));
    console.log('Content saved:', content);
    showNotification('Website content updated successfully! Refresh the website to see changes.', 'success');
}

// Auto-save messages from main site periodically
setInterval(() => {
    if (document.getElementById('dashboardScreen').style.display !== 'none') {
        loadMessages();
        updateStats();
    }
}, 2000);

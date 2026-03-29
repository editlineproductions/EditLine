// Load Dynamic Content from Admin
document.addEventListener('DOMContentLoaded', function() {
    loadDynamicContent();
});

function loadDynamicContent() {
    const CONTENT_KEY = 'editline_content';
    const stored = localStorage.getItem(CONTENT_KEY);
    
    if (stored) {
        const content = JSON.parse(stored);
        
        // Update Hero Section
        document.querySelector('.hero-content h2').textContent = content.heroTitle;
        document.querySelectorAll('.hero-content p')[0].textContent = content.heroSubtitle;
        document.querySelector('.hero-content .subtitle').textContent = content.heroDescription;

        // Update Portfolio
        const portfolioGrid = document.querySelector('.portfolio-grid');
        portfolioGrid.innerHTML = content.portfolio.map(item => `
            <div class="portfolio-item">
                <div class="portfolio-placeholder">${item.image ? `<img src="${item.image}" alt="${item.title}" style="width: 100%; height: 100%; object-fit: cover;">` : item.title}</div>
                <h3>${item.title}</h3>
                <p>${item.description}</p>
            </div>
        `).join('');

        // Update Services
        const servicesGrid = document.querySelector('.services-grid');
        servicesGrid.innerHTML = content.services.map(service => `
            <div class="service-card">
                <h3>${service.name}</h3>
                <p>${service.description}</p>
            </div>
        `).join('');
    }
}

// Form submission handler
document.getElementById('contactForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get form values
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const service = document.getElementById('service').value;
    const message = document.getElementById('message').value.trim();
    
    // Validate form
    if (!name || !email || !service || !message) {
        alert('Please fill in all fields');
        return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Please enter a valid email address');
        return;
    }
    
    // Save message to localStorage
    saveClientMessage({
        name: name,
        email: email,
        service: service,
        message: message,
        timestamp: new Date().getTime()
    });
    
    // Show success message
    alert('Thank you for your message! We will contact you soon.');
    
    // Reset form
    this.reset();
});

// Save client message to localStorage
function saveClientMessage(clientMessage) {
    const MESSAGES_KEY = 'editline_messages';
    const stored = localStorage.getItem(MESSAGES_KEY);
    const messages = stored ? JSON.parse(stored) : [];
    
    // Create message with auto-increment ID
    const newMessage = {
        id: messages.length > 0 ? Math.max(...messages.map(m => m.id)) + 1 : 1,
        ...clientMessage,
        status: 'unread',
        replies: []
    };
    
    messages.push(newMessage);
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
}

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#' && document.querySelector(href)) {
            e.preventDefault();
            document.querySelector(href).scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// Add active state to navigation
window.addEventListener('scroll', function() {
    let current = '';
    
    document.querySelectorAll('section').forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        
        if (window.pageYOffset >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });
    
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + current) {
            link.classList.add('active');
        }
    });
});

// Pricing button click handlers
document.querySelectorAll('.pricing-card .btn').forEach(button => {
    button.addEventListener('click', function() {
        const planName = this.closest('.pricing-card').querySelector('h3').textContent;
        
        // If it's a "Choose Plan" button, navigate to contact
        if (this.textContent === 'Choose Plan') {
            document.getElementById('service').value = '';
            document.getElementById('message').value = `Interested in: ${planName} Plan`;
            document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
        } else if (this.textContent === 'Contact Us') {
            // For Enterprise, scroll to contact
            document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Page load animations
document.addEventListener('DOMContentLoaded', function() {
    // Add fade-in animation to service cards
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    document.querySelectorAll('.service-card, .portfolio-item, .pricing-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

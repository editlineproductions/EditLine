// Load Dynamic Content from Admin
document.addEventListener('DOMContentLoaded', function() {
    loadDynamicContent();
    setupContactForm();
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
const MESSAGES_KEY = 'editline_messages';

function setupContactForm() {
    const contactForm = document.getElementById('contactForm');

    if (!contactForm) {
        return;
    }

    const emailInput = document.getElementById('email');
    const replyToField = document.getElementById('replytoField');

    if (emailInput && replyToField) {
        replyToField.value = emailInput.value.trim();
        emailInput.addEventListener('input', () => {
            replyToField.value = emailInput.value.trim();
        });
    }

    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const submitButton = this.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        const formData = new FormData(this);
        const email = formData.get('email');
        const name = formData.get('name');
        const service = formData.get('service');
        const message = formData.get('message');

        if (email) {
            formData.set('_replyto', email);
        }

        formData.set('_subject', `New ${service || 'service'} inquiry from ${name || 'website visitor'}`);

        submitButton.disabled = true;
        submitButton.textContent = 'Sending...';
        updateFormStatus('Sending your message...', 'info');

        try {
            const response = await fetch(this.action, {
                method: this.method,
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                const errorMessage = result.errors?.map(error => error.message).join(', ') || 'Unable to send your message right now.';
                throw new Error(errorMessage);
            }

            saveMessageToAdminInbox({
                name,
                email,
                service,
                message
            });

            this.reset();
            updateFormStatus('Thank you! Your message has been sent successfully.', 'success');
        } catch (error) {
            console.error('Contact form submission failed:', error);
            updateFormStatus(error.message || 'A network error prevented the message from being sent.', 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    });
}

function saveMessageToAdminInbox({ name, email, service, message }) {
    const storedMessages = localStorage.getItem(MESSAGES_KEY);
    const messages = storedMessages ? JSON.parse(storedMessages) : [];

    messages.unshift({
        id: Date.now(),
        name,
        email,
        service,
        message,
        status: 'unread',
        timestamp: Date.now(),
        replies: []
    });

    localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
}

function updateFormStatus(message, type) {
    const statusElement = document.getElementById('formStatus');

    if (!statusElement) {
        return;
    }

    statusElement.textContent = message;
    statusElement.className = `form-status ${type}`;
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

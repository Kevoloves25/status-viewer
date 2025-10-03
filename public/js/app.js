class StatusBoostApp {
    constructor() {
        this.registeredUsers = 2847;
        this.slotsLeft = 143;
        this.registrationEndTime = Date.now() + (24 * 60 * 60 * 1000); // 24 hours from now
        this.init();
    }

    init() {
        this.updateLiveStats();
        this.startStatsAnimation();
        this.setupEventListeners();
        this.checkRegistrationStatus();
    }

    updateLiveStats() {
        // Update registered users count with random increments
        setInterval(() => {
            if (this.slotsLeft > 0) {
                const newUsers = Math.floor(Math.random() * 3); // 0-2 new users
                this.registeredUsers += newUsers;
                this.slotsLeft = Math.max(0, this.slotsLeft - newUsers);
                
                this.animateCounter('registeredUsers', this.registeredUsers);
                this.animateCounter('slotsLeft', this.slotsLeft);
                this.updateProgressBar();
                
                // Show counter animation
                if (newUsers > 0) {
                    this.showCounterAnimation(newUsers);
                }
            }
        }, 5000); // Update every 5 seconds

        // Update registration timer every second
        setInterval(() => {
            this.updateRegistrationTimer();
        }, 1000);
    }

    animateCounter(elementId, newValue) {
        const element = document.getElementById(elementId);
        if (element) {
            const oldValue = parseInt(element.textContent.replace(/,/g, ''));
            if (oldValue !== newValue) {
                // Add animation class
                element.classList.add('counting');
                
                // Format number with commas
                element.textContent = newValue.toLocaleString();
                
                // Remove animation class after animation
                setTimeout(() => {
                    element.classList.remove('counting');
                }, 1000);
            }
        }
    }

    showCounterAnimation(count) {
        const registeredElement = document.getElementById('registeredUsers');
        if (registeredElement && count > 0) {
            const counterChange = document.createElement('span');
            counterChange.className = 'counter-change';
            counterChange.textContent = `+${count}`;
            counterChange.style.position = 'absolute';
            counterChange.style.right = '-25px';
            counterChange.style.top = '0';
            counterChange.style.color = '#00ff00';
            counterChange.style.fontSize = '0.7em';
            counterChange.style.animation = 'countUp 1s ease-out forwards';
            
            registeredElement.style.position = 'relative';
            registeredElement.appendChild(counterChange);
            
            // Remove after animation
            setTimeout(() => {
                if (counterChange.parentNode) {
                    counterChange.parentNode.removeChild(counterChange);
                }
            }, 1000);
        }
    }

    updateRegistrationTimer() {
        const now = Date.now();
        const remaining = this.registrationEndTime - now;
        
        if (remaining <= 0) {
            document.getElementById('registrationTimer').textContent = 'CLOSED!';
            document.getElementById('registrationTimer').style.color = '#ff0000';
            this.disableRegistration();
            return;
        }
        
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
        
        const timerText = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('registrationTimer').textContent = timerText;
        
        // Change color when less than 1 hour remaining
        if (hours < 1) {
            document.getElementById('registrationTimer').style.color = '#ff4444';
            document.getElementById('registrationTimer').classList.add('pulse-fast');
        }
    }

    updateProgressBar() {
        const totalSlots = this.registeredUsers + this.slotsLeft;
        const filledPercentage = (this.registeredUsers / totalSlots) * 100;
        const progressFill = document.querySelector('.progress-fill');
        
        if (progressFill) {
            progressFill.style.width = `${filledPercentage}%`;
        }
    }

    startStatsAnimation() {
        // Randomly update stats for live effect
        setInterval(() => {
            if (this.slotsLeft > 0 && Math.random() < 0.3) {
                this.registeredUsers += 1;
                this.slotsLeft -= 1;
                
                this.animateCounter('registeredUsers', this.registeredUsers);
                this.animateCounter('slotsLeft', this.slotsLeft);
                this.updateProgressBar();
                this.showCounterAnimation(1);
            }
        }, 8000);
    }

    checkRegistrationStatus() {
        if (this.slotsLeft <= 0 || Date.now() >= this.registrationEndTime) {
            this.disableRegistration();
        }
    }

    disableRegistration() {
        const form = document.getElementById('registerForm');
        const button = form.querySelector('button');
        const inputs = form.querySelectorAll('input');
        
        button.disabled = true;
        button.innerHTML = '⛔ REGISTRATION CLOSED';
        button.style.background = '#666';
        button.style.cursor = 'not-allowed';
        
        inputs.forEach(input => {
            input.disabled = true;
            input.placeholder = 'Registration Closed';
        });
        
        // Add closed banner
        const urgencyBanner = document.createElement('div');
        urgencyBanner.className = 'urgency-banner';
        urgencyBanner.innerHTML = '<div class="urgency-text">🚫 REGISTRATION CLOSED - All Slots Filled!</div>';
        form.parentNode.insertBefore(urgencyBanner, form);
    }

    setupEventListeners() {
        const form = document.getElementById('registerForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegistration();
        });
    }

    handleRegistration() {
        if (this.slotsLeft <= 0) {
            alert('Sorry, all slots have been filled!');
            return;
        }

        const phone = document.getElementById('phone').value;
        const name = document.getElementById('name').value;

        // Simple validation
        if (!phone || !name) {
            this.showError('Please fill in all fields');
            return;
        }

        if (phone.length < 10) {
            this.showError('Please enter a valid phone number');
            return;
        }

        this.registerUser(phone, name);
    }

    showError(message) {
        const button = document.querySelector('.glow-button');
        const originalText = button.innerHTML;
        
        button.innerHTML = `❌ ${message}`;
        button.style.background = '#ff4444';
        button.classList.add('shake');
        
        setTimeout(() => {
            button.innerHTML = originalText;
            button.style.background = '';
            button.classList.remove('shake');
        }, 3000);
    }

    registerUser(phone, name) {
        // Show loading state
        const button = document.querySelector('.glow-button');
        const originalText = button.querySelector('.btn-text').textContent;
        button.querySelector('.btn-text').textContent = 'Activating...';
        button.disabled = true;

        fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ phone, name })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Update stats
                this.registeredUsers += 1;
                this.slotsLeft -= 1;
                this.animateCounter('registeredUsers', this.registeredUsers);
                this.animateCounter('slotsLeft', this.slotsLeft);
                this.updateProgressBar();
                
                // Start user's timer
                statusTimer.start(phone);
                showTimerSection();
                updateCountdownDisplay();
            } else {
                this.showError('Registration failed. Please try again.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            this.showError('Network error. Please try again.');
        })
        .finally(() => {
            // Reset button
            button.querySelector('.btn-text').textContent = originalText;
            button.disabled = false;
        });
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    window.statusBoostApp = new StatusBoostApp();
    
    // Update progress bar initially
    window.statusBoostApp.updateProgressBar();
});

// Existing section switching functions
function showTimerSection() {
    document.getElementById('registrationSection').classList.remove('active');
    document.getElementById('registrationSection').classList.add('hidden');
    document.getElementById('timerSection').classList.remove('hidden');
    document.getElementById('timerSection').classList.add('active');
    document.getElementById('downloadSection').classList.add('hidden');
}

function showDownloadSection() {
    document.getElementById('registrationSection').classList.add('hidden');
    document.getElementById('timerSection').classList.add('hidden');
    document.getElementById('downloadSection').classList.remove('hidden');
    document.getElementById('downloadSection').classList.add('active');
    
    // Trigger celebration
    if (window.wildAnimations) {
        window.wildAnimations.triggerCelebration();
    }
    
    // Setup download button
    document.getElementById('downloadBtn').addEventListener('click', function() {
        const phone = statusTimer.userPhone;
        if (phone) {
            window.open(`/api/download-vcf/${phone}`, '_blank');
        }
    });
}

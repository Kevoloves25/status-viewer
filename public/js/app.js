class StatusBoostApp {
    constructor() {
        // Initialize with values that can be controlled by admin
        this.registeredUsers = window.adminStats ? window.adminStats.registeredUsers : 2847;
        this.slotsLeft = window.adminStats ? window.adminStats.slotsLeft : 143;
        this.registrationEndTime = window.adminStats ? window.adminStats.registrationEndTime : (Date.now() + (24 * 60 * 60 * 1000));
        this.isRegistrationOpen = true;
        
        this.init();
    }

    init() {
        this.updateLiveStats();
        this.startStatsAnimation();
        this.setupEventListeners();
        this.checkRegistrationStatus();
        this.setupAdminSync();
    }

    setupAdminSync() {
        // Create global object for admin to control
        window.adminStats = {
            registeredUsers: this.registeredUsers,
            slotsLeft: this.slotsLeft,
            registrationEndTime: this.registrationEndTime,
            isRegistrationOpen: this.isRegistrationOpen,
            updateFrontend: () => this.updateFromAdmin()
        };
    }

    updateFromAdmin() {
        if (window.adminStats) {
            this.registeredUsers = window.adminStats.registeredUsers;
            this.slotsLeft = window.adminStats.slotsLeft;
            this.registrationEndTime = window.adminStats.registrationEndTime;
            this.isRegistrationOpen = window.adminStats.isRegistrationOpen;
            
            this.animateCounter('registeredUsers', this.registeredUsers);
            this.animateCounter('slotsLeft', this.slotsLeft);
            this.updateProgressBar();
            
            if (!this.isRegistrationOpen) {
                this.disableRegistration();
            }
        }
    }

    updateLiveStats() {
        // Update registration timer every second
        setInterval(() => {
            this.updateRegistrationTimer();
        }, 1000);

        // Sync with admin changes every 2 seconds
        setInterval(() => {
            this.updateFromAdmin();
        }, 2000);
    }

    animateCounter(elementId, newValue) {
        const element = document.getElementById(elementId);
        if (element) {
            const oldValue = parseInt(element.textContent.replace(/,/g, ''));
            if (oldValue !== newValue) {
                element.classList.add('counting');
                element.textContent = newValue.toLocaleString();
                
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
            this.isRegistrationOpen = false;
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
        // Only animate if admin hasn't taken control
        setInterval(() => {
            if (this.slotsLeft > 0 && this.isRegistrationOpen && Math.random() < 0.3) {
                this.registeredUsers += 1;
                this.slotsLeft -= 1;
                
                // Update admin stats if exists
                if (window.adminStats) {
                    window.adminStats.registeredUsers = this.registeredUsers;
                    window.adminStats.slotsLeft = this.slotsLeft;
                }
                
                this.animateCounter('registeredUsers', this.registeredUsers);
                this.animateCounter('slotsLeft', this.slotsLeft);
                this.updateProgressBar();
                this.showCounterAnimation(1);
            }
        }, 8000);
    }

    checkRegistrationStatus() {
        if (this.slotsLeft <= 0 || !this.isRegistrationOpen) {
            this.disableRegistration();
        }
    }

    disableRegistration() {
        const form = document.getElementById('registerForm');
        if (!form) return;
        
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
        
        // Add closed banner if not already exists
        if (!document.querySelector('.urgency-banner')) {
            const urgencyBanner = document.createElement('div');
            urgencyBanner.className = 'urgency-banner';
            urgencyBanner.innerHTML = '<div class="urgency-text">🚫 REGISTRATION CLOSED - All Slots Filled!</div>';
            form.parentNode.insertBefore(urgencyBanner, form);
        }
    }

    setupEventListeners() {
        const form = document.getElementById('registerForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegistration();
            });
        }

        // Download button event
        const downloadBtn = document.getElementById('downloadBtn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                this.handleDownload();
            });
        }

        // WhatsApp group link
        const whatsappLink = document.getElementById('whatsappLink');
        if (whatsappLink) {
            whatsappLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.joinWhatsAppGroup();
            });
        }
    }

    handleRegistration() {
        if (!this.isRegistrationOpen || this.slotsLeft <= 0) {
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
        if (!button) return;
        
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
        if (!button) return;
        
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
                
                // Update admin stats
                if (window.adminStats) {
                    window.adminStats.registeredUsers = this.registeredUsers;
                    window.adminStats.slotsLeft = this.slotsLeft;
                }
                
                this.animateCounter('registeredUsers', this.registeredUsers);
                this.animateCounter('slotsLeft', this.slotsLeft);
                this.updateProgressBar();
                
                // Start user's timer
                if (window.statusTimer) {
                    window.statusTimer.start(phone);
                    showTimerSection();
                    updateCountdownDisplay();
                }
                
                // Show success message
                this.showSuccess('Registration successful! Timer started.');
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
            if (button.querySelector('.btn-text')) {
                button.querySelector('.btn-text').textContent = originalText;
            }
            button.disabled = false;
        });
    }

    showSuccess(message) {
        // Could add a subtle success notification
        console.log('Success:', message);
    }

    handleDownload() {
        if (window.statusTimer && window.statusTimer.userPhone) {
            const phone = window.statusTimer.userPhone;
            window.open(`/api/download-vcf/${phone}`, '_blank');
        } else {
            alert('Please wait for your timer to complete first.');
        }
    }

    joinWhatsAppGroup() {
        // Replace with your actual WhatsApp group link
        const groupLink = 'https://chat.whatsapp.com/KtqoEZY7kLWBp7oMvbupks';
        window.open(groupLink, '_blank');
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    window.statusBoostApp = new StatusBoostApp();
    window.statusBoostApp.updateProgressBar();
});

// Section management functions
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
}

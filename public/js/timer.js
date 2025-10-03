class PersistentTimer {
    constructor(duration = 48 * 60 * 60 * 1000) { // 48 hours default
        this.duration = duration;
        this.storageKey = 'statusBoostTimer';
        this.loadTimer();
    }

    loadTimer() {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
            const data = JSON.parse(saved);
            this.startTime = data.startTime;
            this.userPhone = data.userPhone;
        }
    }

    start(phone) {
        this.startTime = Date.now();
        this.userPhone = phone;
        this.saveTimer();
        return this.startTime;
    }

    saveTimer() {
        const data = {
            startTime: this.startTime,
            userPhone: this.userPhone,
            duration: this.duration
        };
        localStorage.setItem(this.storageKey, JSON.stringify(data));
    }

    getRemainingTime() {
        if (!this.startTime) return 0;
        const elapsed = Date.now() - this.startTime;
        return Math.max(0, this.duration - elapsed);
    }

    isComplete() {
        return this.getRemainingTime() <= 0;
    }

    formatTime(ms) {
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((ms % (1000 * 60)) / 1000);
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    getProgress() {
        if (!this.startTime) return 0;
        const elapsed = Date.now() - this.startTime;
        return Math.min(100, (elapsed / this.duration) * 100);
    }

    clear() {
        localStorage.removeItem(this.storageKey);
        this.startTime = null;
        this.userPhone = null;
    }
}

// Global timer instance
const statusTimer = new PersistentTimer();

// Update countdown display
function updateCountdownDisplay() {
    const display = document.getElementById('countdownDisplay');
    const progressRing = document.querySelector('.progress-ring-circle');
    
    if (!display) return;
    
    const remaining = statusTimer.getRemainingTime();
    const progress = statusTimer.getProgress();
    
    if (statusTimer.isComplete()) {
        display.textContent = '00:00:00';
        if (progressRing) {
            progressRing.style.strokeDashoffset = '0';
        }
        showDownloadSection();
    } else {
        display.textContent = statusTimer.formatTime(remaining);
        if (progressRing) {
            const circumference = 565.48; // 2 * π * 90
            const offset = circumference - (progress / 100) * circumference;
            progressRing.style.strokeDashoffset = offset;
        }
        
        // Update queue count randomly for effect
        const queueCount = document.getElementById('queueCount');
        if (queueCount && Math.random() < 0.1) { // 10% chance to update
            const current = parseInt(queueCount.textContent);
            const newCount = Math.max(1, current - Math.floor(Math.random() * 3));
            queueCount.textContent = newCount;
        }
        
        // Continue updating
        requestAnimationFrame(updateCountdownDisplay);
    }
}

// Start countdown when page loads
document.addEventListener('DOMContentLoaded', function() {
    if (statusTimer.startTime && !statusTimer.isComplete()) {
        showTimerSection();
        updateCountdownDisplay();
    } else if (statusTimer.isComplete() && statusTimer.userPhone) {
        showDownloadSection();
    }
});

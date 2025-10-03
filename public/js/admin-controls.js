class AdminControls {
    constructor() {
        this.autoIncrementInterval = null;
        this.stats = {
            registeredUsers: 2847,
            slotsLeft: 143,
            registrationEndTime: Date.now() + (24 * 60 * 60 * 1000),
            isRegistrationOpen: true
        };
        this.init();
    }

    init() {
        this.updateAdminDisplay();
        this.startLiveSync();
        this.log('Admin panel initialized');
    }

    // Update all admin displays
    updateAdminDisplay() {
        // Update admin panel
        document.getElementById('adminRegistered').textContent = this.formatNumber(this.stats.registeredUsers);
        document.getElementById('adminSlots').textContent = this.formatNumber(this.stats.slotsLeft);
        document.getElementById('adminStatus').textContent = this.stats.isRegistrationOpen ? 'ACTIVE' : 'CLOSED';
        document.getElementById('adminStatus').style.color = this.stats.isRegistrationOpen ? '#00ff00' : '#ff0000';
        
        // Update input fields
        document.getElementById('setRegistered').value = this.stats.registeredUsers;
        document.getElementById('setSlots').value = this.stats.slotsLeft;
        
        // Update timer
        this.updateTimerDisplay();
        
        // Update live preview
        this.updateLivePreview();
        
        // Sync with frontend
        this.syncWithFrontend();
    }

    updateTimerDisplay() {
        const remaining = this.stats.registrationEndTime - Date.now();
        if (remaining <= 0) {
            document.getElementById('adminTimer').textContent = 'ENDED';
            document.getElementById('adminTimer').style.color = '#ff0000';
            this.stats.isRegistrationOpen = false;
        } else {
            const hours = Math.floor(remaining / (1000 * 60 * 60));
            const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
            const timerText = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            document.getElementById('adminTimer').textContent = timerText;
            document.getElementById('adminTimer').style.color = hours < 1 ? '#ff4444' : '#0066ff';
        }
    }

    updateLivePreview() {
        document.getElementById('previewRegistered').textContent = this.formatNumber(this.stats.registeredUsers);
        document.getElementById('previewSlots').textContent = this.formatNumber(this.stats.slotsLeft);
        
        const remaining = this.stats.registrationEndTime - Date.now();
        if (remaining > 0) {
            const hours = Math.floor(remaining / (1000 * 60 * 60));
            const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
            document.getElementById('previewTimer').textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
            document.getElementById('previewTimer').textContent = '00:00:00';
        }
        
        // Update progress bar
        const totalSlots = this.stats.registeredUsers + this.stats.slotsLeft;
        const progress = (this.stats.registeredUsers / totalSlots) * 100;
        document.getElementById('previewProgress').style.width = `${progress}%`;
    }

    // Core control functions
    setRegisteredUsers() {
        const newValue = parseInt(document.getElementById('setRegistered').value);
        if (!isNaN(newValue)) {
            const oldValue = this.stats.registeredUsers;
            this.stats.registeredUsers = newValue;
            this.log(`Changed registered users from ${oldValue} to ${newValue}`);
            this.updateAdminDisplay();
        }
    }

    setSlotsRemaining() {
        const newValue = parseInt(document.getElementById('setSlots').value);
        if (!isNaN(newValue)) {
            const oldValue = this.stats.slotsLeft;
            this.stats.slotsLeft = newValue;
            this.log(`Changed slots remaining from ${oldValue} to ${newValue}`);
            this.updateAdminDisplay();
        }
    }

    incrementUsers(count) {
        this.stats.registeredUsers += count;
        this.stats.slotsLeft = Math.max(0, this.stats.slotsLeft - count);
        this.log(`Added ${count} new users (simulated registration)`);
        this.updateAdminDisplay();
    }

    setTimer() {
        const hours = parseInt(document.getElementById('setHours').value);
        if (!isNaN(hours)) {
            this.stats.registrationEndTime = Date.now() + (hours * 60 * 60 * 1000);
            this.log(`Set registration timer to ${hours} hours`);
            this.updateAdminDisplay();
        }
    }

    addTime(hours) {
        this.stats.registrationEndTime += hours * 60 * 60 * 1000;
        this.log(`Added ${hours} hours to registration timer`);
        this.updateAdminDisplay();
    }

    setUrgent() {
        this.stats.registrationEndTime = Date.now() + (60 * 60 * 1000); // 1 hour
        this.log('Set urgent timer (1 hour remaining)');
        this.updateAdminDisplay();
    }

    endTimer() {
        this.stats.registrationEndTime = Date.now();
        this.stats.isRegistrationOpen = false;
        this.log('Ended registration timer immediately');
        this.updateAdminDisplay();
    }

    closeRegistration() {
        this.stats.isRegistrationOpen = false;
        this.stats.slotsLeft = 0;
        this.log('Closed registration - all slots filled');
        this.updateAdminDisplay();
    }

    openRegistration() {
        this.stats.isRegistrationOpen = true;
        this.stats.slotsLeft = Math.max(50, this.stats.slotsLeft);
        this.log('Reopened registration');
        this.updateAdminDisplay();
    }

    boostStats() {
        const boostAmount = 50;
        this.stats.registeredUsers += boostAmount;
        this.stats.slotsLeft = Math.max(0, this.stats.slotsLeft - boostAmount);
        this.log(`🚀 BOOSTED: Added ${boostAmount} users instantly`);
        this.updateAdminDisplay();
    }

    simulateRegistrations() {
        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                this.incrementUsers(1);
            }, i * 300);
        }
        this.log('Simulating 10 rapid registrations...');
    }

    // Automation functions
    startAutoIncrement() {
        const interval = parseInt(document.getElementById('autoInterval').value) * 1000;
        const increment = parseInt(document.getElementById('autoIncrement').value);
        
        if (this.autoIncrementInterval) {
            clearInterval(this.autoIncrementInterval);
        }
        
        this.autoIncrementInterval = setInterval(() => {
            if (this.stats.slotsLeft > 0) {
                this.incrementUsers(increment);
            } else {
                this.stopAutoIncrement();
                this.log('Auto-increment stopped: No slots left');
            }
        }, interval);
        
        this.log(`Started auto-increment: +${increment} users every ${interval/1000}s`);
    }

    stopAutoIncrement() {
        if (this.autoIncrementInterval) {
            clearInterval(this.autoIncrementInterval);
            this.autoIncrementInterval = null;
            this.log('Stopped auto-increment');
        }
    }

    // Preset scenarios
    setScenario(scenario) {
        switch(scenario) {
            case 'almostFull':
                this.stats.registeredUsers = 950;
                this.stats.slotsLeft = 50;
                this.stats.registrationEndTime = Date.now() + (2 * 60 * 60 * 1000);
                this.log('Set scenario: Almost Full (95% filled)');
                break;
            case 'halfway':
                this.stats.registeredUsers = 500;
                this.stats.slotsLeft = 500;
                this.stats.registrationEndTime = Date.now() + (12 * 60 * 60 * 1000);
                this.log('Set scenario: Halfway (50% filled)');
                break;
            case 'justLaunched':
                this.stats.registeredUsers = 100;
                this.stats.slotsLeft = 900;
                this.stats.registrationEndTime = Date.now() + (48 * 60 * 60 * 1000);
                this.log('Set scenario: Just Launched (10% filled)');
                break;
            case 'lastFew':
                this.stats.registeredUsers = 980;
                this.stats.slotsLeft = 20;
                this.stats.registrationEndTime = Date.now() + (30 * 60 * 1000);
                this.log('Set scenario: Last Few Slots');
                break;
            case 'viral':
                this.stats.registeredUsers = 750;
                this.stats.slotsLeft = 250;
                this.stats.registrationEndTime = Date.now() + (6 * 60 * 60 * 1000);
                this.log('Set scenario: Viral Growth');
                // Start rapid auto-increment
                this.startAutoIncrement();
                break;
        }
        this.updateAdminDisplay();
    }

    resetAll() {
        this.stats = {
            registeredUsers: 2847,
            slotsLeft: 143,
            registrationEndTime: Date.now() + (24 * 60 * 60 * 1000),
            isRegistrationOpen: true
        };
        this.stopAutoIncrement();
        this.log('Reset all statistics to default');
        this.updateAdminDisplay();
    }

    // Sync with frontend
    syncWithFrontend() {
        // Update the main frontend app if it exists
        if (window.statusBoostApp) {
            window.statusBoostApp.registeredUsers = this.stats.registeredUsers;
            window.statusBoostApp.slotsLeft = this.stats.slotsLeft;
            window.statusBoostApp.registrationEndTime = this.stats.registrationEndTime;
            
            // Update frontend displays
            window.statusBoostApp.animateCounter('registeredUsers', this.stats.registeredUsers);
            window.statusBoostApp.animateCounter('slotsLeft', this.stats.slotsLeft);
            window.statusBoostApp.updateProgressBar();
            
            // Check registration status
            if (!this.stats.isRegistrationOpen) {
                window.statusBoostApp.disableRegistration();
            }
        }
    }

    startLiveSync() {
        setInterval(() => {
            this.updateTimerDisplay();
            this.updateLivePreview();
            this.syncWithFrontend();
        }, 1000);
    }

    // Utility functions
    formatNumber(num) {
        return num.toLocaleString();
    }

    log(message) {
        const logContainer = document.getElementById('systemLog');
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        
        if (message.includes('🚀') || message.includes('BOOSTED')) {
            logEntry.className += ' log-success';
        } else if (message.includes('ERROR') || message.includes('FAILED')) {
            logEntry.className += ' log-error';
        }
        
        logEntry.textContent = `[${timestamp}] ${message}`;
        logContainer.appendChild(logEntry);
        logContainer.scrollTop = logContainer.scrollHeight;
    }

    clearLog() {
        document.getElementById('systemLog').innerHTML = '';
        this.log('Log cleared');
    }

    exportStats() {
        const data = {
            timestamp: new Date().toISOString(),
            stats: this.stats,
            totalRegistrations: this.stats.registeredUsers,
            conversionRate: ((this.stats.registeredUsers / (this.stats.registeredUsers + this.stats.slotsLeft)) * 100).toFixed(2) + '%'
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `statusboost-stats-${Date.now()}.json`;
        a.click();
        
        this.log('Exported statistics to JSON file');
    }
}

// Initialize admin controls
const adminControls = new AdminControls();


class AdminControls {
    constructor() {
        this.autoIncrementInterval = null;
        this.stats = {
            registeredUsers: 2847,
            slotsLeft: 143,
            registrationEndTime: Date.now() + (24 * 60 * 60 * 1000),
            isRegistrationOpen: true
        };
        
        // NEW: WebSocket client reference
        this.realTimeClient = null;
        
        this.init();
    }

    init() {
        this.updateAdminDisplay();
        this.startLiveSync();
        this.log('Admin panel initialized');
        
        // NEW: Wait for real-time client to be available
        this.waitForRealTimeClient();
    }

    // NEW: Wait for real-time client
    waitForRealTimeClient() {
        if (window.realTimeClient) {
            this.realTimeClient = window.realTimeClient;
            this.log('Real-time WebSocket connected');
        } else {
            setTimeout(() => this.waitForRealTimeClient(), 100);
        }
    }

    // NEW: Broadcast stats to all connected clients
    broadcastStats() {
        if (this.realTimeClient && this.realTimeClient.sendStatsUpdate) {
            this.realTimeClient.sendStatsUpdate(this.stats);
        }
    }

    // MODIFIED: Add broadcast to existing methods
    setRegisteredUsers() {
        const newValue = parseInt(document.getElementById('setRegistered').value);
        if (!isNaN(newValue)) {
            const oldValue = this.stats.registeredUsers;
            this.stats.registeredUsers = newValue;
            this.log(`Changed registered users from ${oldValue} to ${newValue}`);
            this.updateAdminDisplay();
            this.broadcastStats(); // NEW: Broadcast changes
        }
    }

    setSlotsRemaining() {
        const newValue = parseInt(document.getElementById('setSlots').value);
        if (!isNaN(newValue)) {
            const oldValue = this.stats.slotsLeft;
            this.stats.slotsLeft = newValue;
            this.log(`Changed slots remaining from ${oldValue} to ${newValue}`);
            this.updateAdminDisplay();
            this.broadcastStats(); // NEW: Broadcast changes
        }
    }

    incrementUsers(count) {
        this.stats.registeredUsers += count;
        this.stats.slotsLeft = Math.max(0, this.stats.slotsLeft - count);
        this.log(`Added ${count} new users (simulated registration)`);
        this.updateAdminDisplay();
        this.broadcastStats(); // NEW: Broadcast changes
    }

    setTimer() {
        const hours = parseInt(document.getElementById('setHours').value);
        if (!isNaN(hours)) {
            this.stats.registrationEndTime = Date.now() + (hours * 60 * 60 * 1000);
            this.log(`Set registration timer to ${hours} hours`);
            this.updateAdminDisplay();
            this.broadcastStats(); // NEW: Broadcast changes
        }
    }

    // ADD this method to handle incoming real-time updates
    updateFromServer(stats) {
        this.stats = { ...this.stats, ...stats };
        this.updateAdminDisplay();
        this.log('Stats updated from server');
    }
}

// Initialize admin controls
const adminControls = new AdminControls();

// NEW: Make it globally accessible for real-time client
window.adminControls = adminControls;

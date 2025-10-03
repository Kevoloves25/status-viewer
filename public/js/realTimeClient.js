class RealTimeClient {
    constructor() {
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.isConnected = false;
        
        this.init();
    }

    init() {
        this.connect();
        this.setupEventListeners();
    }

    connect() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;
        
        try {
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                console.log('WebSocket connected');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.onConnect();
            };
            
            this.ws.onmessage = (event) => {
                this.handleMessage(event);
            };
            
            this.ws.onclose = () => {
                console.log('WebSocket disconnected');
                this.isConnected = false;
                this.handleDisconnect();
            };
            
            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.isConnected = false;
            };
            
        } catch (error) {
            console.error('WebSocket connection failed:', error);
            this.handleDisconnect();
        }
    }

    handleDisconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
            
            console.log(`Reconnecting in ${delay}ms... (Attempt ${this.reconnectAttempts})`);
            
            setTimeout(() => {
                this.connect();
            }, delay);
        } else {
            console.error('Max reconnection attempts reached');
            this.fallbackToPolling();
        }
    }

    fallbackToPolling() {
        console.log('Falling back to polling...');
        setInterval(() => {
            this.fetchStats();
        }, 5000);
    }

    fetchStats() {
        fetch('/api/real-time/stats')
            .then(response => response.json())
            .then(stats => {
                this.updateFrontend(stats);
            })
            .catch(error => {
                console.error('Error fetching stats:', error);
            });
    }

    handleMessage(event) {
        try {
            const data = JSON.parse(event.data);
            
            switch (data.type) {
                case 'INIT_STATS':
                    console.log('Received initial stats:', data.data);
                    this.updateFrontend(data.data);
                    break;
                    
                case 'STATS_UPDATE':
                    this.updateFrontend(data.data);
                    break;
                    
                case 'REGISTRATION_CLOSED':
                    this.handleRegistrationClosed(data.data);
                    break;
                    
                case 'NEW_REGISTRATION':
                    if (this.isAdmin) {
                        this.handleNewRegistration(data.data);
                    }
                    break;
                    
                case 'PONG':
                    // Keep alive response
                    break;
            }
        } catch (error) {
            console.error('Error handling message:', error);
        }
    }

    updateFrontend(stats) {
        // Update frontend elements
        this.updateCounter('registeredUsers', stats.registeredUsers);
        this.updateCounter('slotsLeft', stats.slotsLeft);
        this.updateTimer(stats.registrationEndTime);
        this.updateProgressBar(stats);
        
        // Update global stats for other components
        if (window.statusBoostApp) {
            window.statusBoostApp.registeredUsers = stats.registeredUsers;
            window.statusBoostApp.slotsLeft = stats.slotsLeft;
            window.statusBoostApp.registrationEndTime = stats.registrationEndTime;
            window.statusBoostApp.isRegistrationOpen = stats.isRegistrationOpen;
        }
        
        // Update admin panel if open
        if (this.isAdmin && window.adminControls) {
            window.adminControls.stats = stats;
            window.adminControls.updateAdminDisplay();
        }
    }

    updateCounter(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            const currentValue = parseInt(element.textContent.replace(/,/g, '')) || 0;
            if (currentValue !== value) {
                element.textContent = value.toLocaleString();
                
                // Add animation effect
                element.classList.add('counting');
                setTimeout(() => {
                    element.classList.remove('counting');
                }, 1000);
            }
        }
    }

    updateTimer(endTime) {
        const timerElement = document.getElementById('registrationTimer');
        if (!timerElement) return;
        
        const remaining = endTime - Date.now();
        
        if (remaining <= 0) {
            timerElement.textContent = 'CLOSED!';
            timerElement.style.color = '#ff0000';
        } else {
            const hours = Math.floor(remaining / (1000 * 60 * 60));
            const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
            
            const timerText = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            timerElement.textContent = timerText;
            
            if (hours < 1) {
                timerElement.style.color = '#ff4444';
                timerElement.classList.add('pulse-fast');
            }
        }
    }

    updateProgressBar(stats) {
        const totalSlots = stats.registeredUsers + stats.slotsLeft;
        const filledPercentage = (stats.registeredUsers / totalSlots) * 100;
        const progressFill = document.querySelector('.progress-fill');
        
        if (progressFill) {
            progressFill.style.width = `${filledPercentage}%`;
        }
    }

    handleRegistrationClosed(stats) {
        if (window.statusBoostApp) {
            window.statusBoostApp.disableRegistration();
        }
        
        // Show notification
        this.showNotification('Registration Closed', 'All slots have been filled!', 'error');
    }

    handleNewRegistration(user) {
        // Admin-specific handling for new registrations
        console.log('New registration:', user);
        
        if (window.adminControls) {
            window.adminControls.log(`New registration: ${user.name} (${user.phone})`);
        }
    }

    send(message) {
        if (this.ws && this.isConnected) {
            this.ws.send(JSON.stringify(message));
        }
    }

    onConnect() {
        // Send initial request for stats
        this.send({ type: 'GET_STATS' });
        
        // Start keep-alive ping
        setInterval(() => {
            if (this.isConnected) {
                this.send({ type: 'PING' });
            }
        }, 30000);
    }

    setupEventListeners() {
        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && !this.isConnected) {
                this.connect();
            }
        });
    }

    showNotification(title, message, type = 'info') {
        // Simple notification system
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#ff4444' : '#0066ff'};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            z-index: 10000;
            max-width: 300px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        `;
        
        notification.innerHTML = `
            <strong>${title}</strong>
            <div>${message}</div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }
}

// Admin Real-Time Client
class AdminRealTimeClient extends RealTimeClient {
    constructor() {
        super();
        this.isAdmin = true;
    }

    sendStatsUpdate(newStats) {
        this.send({
            type: 'ADMIN_UPDATE',
            data: newStats
        });
    }

    simulateRegistrations(count) {
        fetch('/api/admin/control', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'simulateRegistrations',
                data: { count }
            })
        });
    }

    setScenario(scenario) {
        fetch('/api/admin/control', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'setScenario',
                data: { scenario }
            })
        });
    }
}

// Initialize appropriate client based on page
document.addEventListener('DOMContentLoaded', function() {
    const isAdminPage = window.location.pathname.includes('admin');
    
    if (isAdminPage) {
        window.realTimeClient = new AdminRealTimeClient();
    } else {
        window.realTimeClient = new RealTimeClient();
    }
});

const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const path = require('path');
const fs = require('fs');

class AdminRealTimeClient extends RealTimeClient {
    constructor() {
        super();
        this.isAdmin = true;
    }

    // NEW: Send stats updates to server
    sendStatsUpdate(newStats) {
        this.send({
            type: 'ADMIN_UPDATE',
            data: newStats
        });
    }

    // NEW: Update admin controls when stats change
    updateFrontend(stats) {
        super.updateFrontend(stats);
        
        // Update admin panel if exists
        if (window.adminControls) {
            window.adminControls.updateFromServer(stats);
        }
    }
}


class RealTimeServer {
    constructor(port = 3000) {
        this.port = port;
        this.app = express();
        this.server = http.createServer(this.app);
        this.wss = new WebSocket.Server({ server: this.server });
        
        // Store connected clients
        this.clients = new Set();
        this.adminClients = new Set();
        
        // Current stats state
        this.stats = {
            registeredUsers: 2847,
            slotsLeft: 143,
            registrationEndTime: Date.now() + (24 * 60 * 60 * 1000),
            isRegistrationOpen: true,
            totalSlots: 1000,
            lastUpdated: Date.now()
        };
        
        this.init();
    }

    init() {
        this.setupExpress();
        this.setupWebSocket();
        this.setupRoutes();
        this.startAutomation();
        this.loadStats();
    }

    setupExpress() {
        this.app.use(express.json());
        this.app.use(express.static('public'));
        
        // Serve admin panel
        this.app.get('/admin', (req, res) => {
            res.sendFile(path.join(__dirname, '../public/admin.html'));
        });
        
        // API routes
        this.app.post('/api/register', this.handleRegistration.bind(this));
        this.app.get('/api/download-vcf/:phone', this.handleDownload.bind(this));
        this.app.get('/api/stats', this.getStats.bind(this));
        this.app.post('/api/admin/update', this.handleAdminUpdate.bind(this));
    }

    setupWebSocket() {
        this.wss.on('connection', (ws, req) => {
            console.log('New client connected');
            this.clients.add(ws);
            
            // Check if it's an admin connection
            const isAdmin = req.url.includes('admin');
            if (isAdmin) {
                this.adminClients.add(ws);
                console.log('Admin client connected');
            }
            
            // Send current stats to new client
            ws.send(JSON.stringify({
                type: 'INIT_STATS',
                data: this.stats
            }));
            
            ws.on('message', (message) => {
                this.handleWebSocketMessage(ws, message);
            });
            
            ws.on('close', () => {
                this.clients.delete(ws);
                this.adminClients.delete(ws);
                console.log('Client disconnected');
            });
            
            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
                this.clients.delete(ws);
                this.adminClients.delete(ws);
            });
        });
    }

    handleWebSocketMessage(ws, message) {
        try {
            const data = JSON.parse(message);
            
            switch (data.type) {
                case 'ADMIN_UPDATE':
                    if (this.adminClients.has(ws)) {
                        this.updateStats(data.data);
                        this.broadcastToAll({
                            type: 'STATS_UPDATE',
                            data: this.stats
                        });
                    }
                    break;
                    
                case 'GET_STATS':
                    ws.send(JSON.stringify({
                        type: 'STATS_UPDATE',
                        data: this.stats
                    }));
                    break;
                    
                case 'PING':
                    ws.send(JSON.stringify({ type: 'PONG' }));
                    break;
            }
        } catch (error) {
            console.error('Error handling WebSocket message:', error);
        }
    }

    updateStats(newStats) {
        this.stats = { ...this.stats, ...newStats, lastUpdated: Date.now() };
        this.saveStats();
        console.log('Stats updated:', this.stats);
    }

    broadcastToAll(message) {
        const messageStr = JSON.stringify(message);
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(messageStr);
            }
        });
    }

    broadcastToAdmins(message) {
        const messageStr = JSON.stringify(message);
        this.adminClients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(messageStr);
            }
        });
    }

    setupRoutes() {
        // Real-time stats endpoint
        this.app.get('/api/real-time/stats', (req, res) => {
            res.json(this.stats);
        });
        
        // Admin control endpoint
        this.app.post('/api/admin/control', (req, res) => {
            const { action, data } = req.body;
            this.handleAdminControl(action, data, res);
        });
    }

    handleAdminControl(action, data, res) {
        switch (action) {
            case 'updateStats':
                this.updateStats(data);
                this.broadcastToAll({
                    type: 'STATS_UPDATE',
                    data: this.stats
                });
                res.json({ success: true, stats: this.stats });
                break;
                
            case 'simulateRegistrations':
                this.simulateRegistrations(data.count || 1);
                res.json({ success: true, stats: this.stats });
                break;
                
            case 'setScenario':
                this.setScenario(data.scenario);
                res.json({ success: true, stats: this.stats });
                break;
                
            default:
                res.status(400).json({ error: 'Unknown action' });
        }
    }

    // Automation system
    startAutomation() {
        // Auto-increment users randomly
        setInterval(() => {
            if (this.stats.isRegistrationOpen && this.stats.slotsLeft > 0 && Math.random() < 0.3) {
                this.stats.registeredUsers += 1;
                this.stats.slotsLeft -= 1;
                this.stats.lastUpdated = Date.now();
                
                this.broadcastToAll({
                    type: 'STATS_UPDATE',
                    data: this.stats
                });
                
                this.saveStats();
            }
        }, 8000);
        
        // Check registration timer
        setInterval(() => {
            if (this.stats.registrationEndTime <= Date.now() && this.stats.isRegistrationOpen) {
                this.stats.isRegistrationOpen = false;
                this.broadcastToAll({
                    type: 'REGISTRATION_CLOSED',
                    data: this.stats
                });
                this.saveStats();
            }
        }, 1000);
    }

    simulateRegistrations(count) {
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                if (this.stats.slotsLeft > 0) {
                    this.stats.registeredUsers += 1;
                    this.stats.slotsLeft -= 1;
                    
                    this.broadcastToAll({
                        type: 'STATS_UPDATE',
                        data: this.stats
                    });
                }
            }, i * 300);
        }
        this.saveStats();
    }

    setScenario(scenario) {
        const scenarios = {
            almostFull: {
                registeredUsers: 950,
                slotsLeft: 50,
                registrationEndTime: Date.now() + (2 * 60 * 60 * 1000)
            },
            halfway: {
                registeredUsers: 500,
                slotsLeft: 500,
                registrationEndTime: Date.now() + (12 * 60 * 60 * 1000)
            },
            justLaunched: {
                registeredUsers: 100,
                slotsLeft: 900,
                registrationEndTime: Date.now() + (48 * 60 * 60 * 1000)
            },
            lastFew: {
                registeredUsers: 980,
                slotsLeft: 20,
                registrationEndTime: Date.now() + (30 * 60 * 1000)
            }
        };
        
        if (scenarios[scenario]) {
            this.updateStats(scenarios[scenario]);
            this.broadcastToAll({
                type: 'STATS_UPDATE',
                data: this.stats
            });
        }
    }

    // User registration handler
    async handleRegistration(req, res) {
        const { phone, name } = req.body;
        
        if (!phone || !name) {
            return res.status(400).json({ error: 'Phone and name required' });
        }

        // Store user in database
        const users = this.loadUsers();
        const existingUser = users.find(user => user.phone === phone);
        
        if (existingUser) {
            return res.json({ 
                success: true, 
                message: 'Already registered!',
                timerStart: existingUser.timestamp
            });
        }

        const newUser = {
            phone,
            name,
            timestamp: Date.now(),
            ip: req.ip
        };
        
        users.push(newUser);
        this.saveUsers(users);

        // Update stats
        this.stats.registeredUsers += 1;
        this.stats.slotsLeft = Math.max(0, this.stats.slotsLeft - 1);
        
        // Broadcast update to all connected clients
        this.broadcastToAll({
            type: 'STATS_UPDATE',
            data: this.stats
        });
        
        // Broadcast new registration to admin
        this.broadcastToAdmins({
            type: 'NEW_REGISTRATION',
            data: newUser
        });

        this.saveStats();

        res.json({ 
            success: true, 
            message: 'Registration complete! Timer started.',
            timerStart: newUser.timestamp
        });
    }

    // Modified handleDownload function - SINGLE VCF FILE
handleDownload(req, res) {
    const users = this.loadUsers();
    
    // Check if 48 hours have passed since first registration
    const firstUserTime = Math.min(...users.map(u => u.timestamp));
    const fortyEightHours = 48 * 60 * 60 * 1000;
    
    if (Date.now() - firstUserTime < fortyEightHours) {
        return res.status(403).json({ 
            error: 'Master contact file not ready yet', 
            remaining: fortyEightHours - (Date.now() - firstUserTime) 
        });
    }

    // Generate SINGLE master VCF with ALL numbers
    let vcfContent = '';
    users.forEach(user => {
        vcfContent += `BEGIN:VCARD
VERSION:3.0
FN:${user.name}
TEL:${user.phone}
END:VCARD\n`;
    });

    const filename = 'statusboost_contacts.vcf'; // SINGLE FILE
    const filepath = path.join(__dirname, '../vcf-files', filename);
    
    // Overwrite the same file every time
    fs.writeFileSync(filepath, vcfContent);
    
    res.download(filepath, filename);
}

// Remove individual user phone check
// handleDownload(req, res) {
//     const { phone } = req.params; // REMOVE THIS
//     const users = this.loadUsers();
//     const user = users.find(u => u.phone === phone); // REMOVE THIS

    getStats(req, res) {
        res.json(this.stats);
    }

    handleAdminUpdate(req, res) {
        const { stats } = req.body;
        
        if (stats) {
            this.updateStats(stats);
            this.broadcastToAll({
                type: 'STATS_UPDATE',
                data: this.stats
            });
            res.json({ success: true, stats: this.stats });
        } else {
            res.status(400).json({ error: 'No stats provided' });
        }
    }

    // Data persistence
    loadStats() {
        try {
            if (fs.existsSync('./data/stats.json')) {
                const data = fs.readFileSync('./data/stats.json', 'utf8');
                const savedStats = JSON.parse(data);
                this.stats = { ...this.stats, ...savedStats };
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    saveStats() {
        try {
            if (!fs.existsSync('./data')) {
                fs.mkdirSync('./data', { recursive: true });
            }
            fs.writeFileSync('./data/stats.json', JSON.stringify(this.stats, null, 2));
        } catch (error) {
            console.error('Error saving stats:', error);
        }
    }

    loadUsers() {
        try {
            if (fs.existsSync('./data/users.json')) {
                const data = fs.readFileSync('./data/users.json', 'utf8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.error('Error loading users:', error);
        }
        return [];
    }

    saveUsers(users) {
        try {
            if (!fs.existsSync('./data')) {
                fs.mkdirSync('./data', { recursive: true });
            }
            fs.writeFileSync('./data/users.json', JSON.stringify(users, null, 2));
        } catch (error) {
            console.error('Error saving users:', error);
        }
    }

    start() {
        this.server.listen(this.port, () => {
            console.log(`🚀 RealTime Server running on port ${this.port}`);
            console.log(`🔥 Main site: http://localhost:${this.port}`);
            console.log(`👑 Admin panel: http://localhost:${this.port}/admin`);
            console.log(`📊 WebSocket server ready for real-time updates`);
        });
    }
}

// Start the server
const server = new RealTimeServer(process.env.PORT || 3000);
server.start();

module.exports = RealTimeServer;

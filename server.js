const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Ensure directories exist
if (!fs.existsSync('./data')) fs.mkdirSync('./data');
if (!fs.existsSync('./vcf-files')) fs.mkdirSync('./vcf-files');
if (!fs.existsSync('./data/users.json')) {
    fs.writeFileSync('./data/users.json', '[]');
}

// Routes
app.post('/api/register', (req, res) => {
    const { phone, name } = req.body;
    
    if (!phone || !name) {
        return res.status(400).json({ error: 'Phone and name required' });
    }

    // Read existing users
    const users = JSON.parse(fs.readFileSync('./data/users.json', 'utf8'));
    
    // Check if user already exists
    const existingUser = users.find(user => user.phone === phone);
    if (existingUser) {
        return res.json({ 
            success: true, 
            message: 'Already registered!',
            timerStart: existingUser.timestamp
        });
    }

    // Add new user
    const newUser = {
        phone,
        name,
        timestamp: Date.now(),
        ip: req.ip
    };
    
    users.push(newUser);
    fs.writeFileSync('./data/users.json', JSON.stringify(users, null, 2));

    res.json({ 
        success: true, 
        message: 'Registration complete! Timer started.',
        timerStart: newUser.timestamp
    });
});

app.get('/api/download-vcf/:phone', (req, res) => {
    const { phone } = req.params;
    const users = JSON.parse(fs.readFileSync('./data/users.json', 'utf8'));
    const user = users.find(u => u.phone === phone);
    
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    // Check if 48 hours have passed
    const timeElapsed = Date.now() - user.timestamp;
    const fortyEightHours = 48 * 60 * 60 * 1000;
    
    if (timeElapsed < fortyEightHours) {
        return res.status(403).json({ 
            error: 'Timer not complete', 
            remaining: fortyEightHours - timeElapsed 
        });
    }

    // Generate VCF file
    const vcfContent = `BEGIN:VCARD
VERSION:3.0
FN:${user.name}
TEL:${user.phone}
END:VCARD`;

    const filename = `statusboost_${phone}.vcf`;
    const filepath = path.join(__dirname, 'vcf-files', filename);
    
    fs.writeFileSync(filepath, vcfContent);
    
    res.download(filepath, filename);
});

app.listen(PORT, () => {
    console.log(`🚀 StatusBoost Pro running on port ${PORT}`);
    console.log(`🔥 Visit: http://localhost:${PORT}`);
});



// Add this to your existing server.js routes

// Admin data endpoint (for potential future backend integration)
app.get('/api/admin/stats', (req, res) => {
    const users = JSON.parse(fs.readFileSync('./data/users.json', 'utf8'));
    res.json({
        totalUsers: users.length,
        last24Hours: users.filter(u => Date.now() - u.timestamp < 24 * 60 * 60 * 1000).length,
        activeRegistrations: users.length
    });
});

// Serve admin panel
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

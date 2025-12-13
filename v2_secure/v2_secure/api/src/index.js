const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const adminRoutes = require('./routes/admin');
const doctorRoutes = require('./routes/doctor');
const nurseRoutes = require('./routes/nurse');

const app = express();

// Secure configuration
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(bodyParser.json());

// Secure logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    // Body logging removed for security
    next();
});

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Routes
app.use('/auth', authRoutes);
app.use('/patients', patientRoutes);
app.use('/admin', adminRoutes);
app.use('/doctor', doctorRoutes);
app.use('/nurse', nurseRoutes);

// Root
app.get('/', (req, res) => {
    res.send('HealthCure Alpha API (v1_insecure) is running.');
});

// Secure error handling
app.use((err, req, res, next) => {
    console.error(err.message);
    res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
    });
});

if (require.main === module) {
    app.listen(config.port, () => {
        console.log(`API running on port ${config.port}`);
    });
}

module.exports = app;

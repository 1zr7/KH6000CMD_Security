const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const config = require('./config');
const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const adminRoutes = require('./routes/admin');
const doctorRoutes = require('./routes/doctor');
const nurseRoutes = require('./routes/nurse');

const app = express();

// WARNING: intentionally vulnerable configuration
app.use(cors({ origin: '*' }));
app.use(bodyParser.json());

// WARNING: intentionally vulnerable logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log('Body:', JSON.stringify(req.body)); // LEAKS SENSITIVE DATA
    next();
});

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

// WARNING: intentionally vulnerable error handling
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message,
        stack: err.stack, // LEAKS STACK TRACE
    });
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(config.port, () => {
        console.log(`API running on port ${config.port}`);
    });
}

module.exports = app;

const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const config = require('./config');

const pool = new Pool(config.db);

const seed = async () => {
  try {
    console.log('Connecting to database...');

    // Drop tables in order
    const tables = ['medications', 'diagnoses', 'appointments', 'doctor_patients', 'nurses', 'doctors', 'patients', 'audit_log', 'users'];
    for (const t of tables) {
      await pool.query(`DROP TABLE IF EXISTS ${t} CASCADE`);
    }

    // Create Users Table
    await pool.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL,
        role VARCHAR(20) NOT NULL,
        email VARCHAR(100) UNIQUE, -- Added email for 2FA
        otp_hash VARCHAR(100),     -- Store hashed OTP
        otp_expires TIMESTAMP      -- OTP expiration
      )
    `);

    // Create Profile Tables
    await pool.query(`
      CREATE TABLE doctors (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        specialty VARCHAR(100),
        assigned_nurse_id INTEGER -- Will reference users(id) of a nurse
      )
    `);

    await pool.query(`
      CREATE TABLE nurses (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL
      )
    `);

    await pool.query(`
      CREATE TABLE patients (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        dob VARCHAR(20),
        address TEXT
      )
    `);

    // Create Workflow Tables
    await pool.query(`
      CREATE TABLE appointments (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES users(id),
        doctor_id INTEGER REFERENCES users(id),
        date_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, completed
        reason TEXT
      )
    `);

    await pool.query(`
      CREATE TABLE diagnoses (
        id SERIAL PRIMARY KEY,
        appointment_id INTEGER REFERENCES appointments(id),
        doctor_id INTEGER REFERENCES users(id),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE medications (
        id SERIAL PRIMARY KEY,
        appointment_id INTEGER REFERENCES appointments(id),
        nurse_id INTEGER REFERENCES users(id),
        patient_id INTEGER REFERENCES users(id),
        drug_name VARCHAR(100),
        dosage VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE audit_log (
        id SERIAL PRIMARY KEY,
        action VARCHAR(100),
        actor_id INTEGER,
        details TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Tables created.');

    // Seed Users
    const users = [
      { username: 'admin', password: 'admin123', role: 'admin', email: 'admin@example.com' },
      { username: 'dr_house', password: 'password', role: 'doctor', email: 'house@example.com' },
      { username: 'nurse_joy', password: 'password', role: 'nurse', email: 'joy@example.com' },
      { username: 'jdoe', password: 'password123', role: 'patient', email: 'jdoe@example.com' },
      { username: 'asmith', password: 'password123', role: 'patient', email: 'asmith@example.com' }
    ];

    const userMap = {};

    const saltRounds = 10;
    for (const u of users) {
      const hash = await bcrypt.hash(u.password, saltRounds);
      const query = 'INSERT INTO users (username, password, role, email) VALUES ($1, $2, $3, $4) RETURNING id, username, role';
      console.log(`Seeding user: ${u.username}`);
      const res = await pool.query(query, [u.username, hash, u.role, u.email]);
      userMap[u.username] = res.rows[0];
    }

    // Seed Profiles
    // Doctor
    await pool.query('INSERT INTO doctors (user_id, name, specialty) VALUES ($1, $2, $3)', [userMap['dr_house'].id, 'Gregory House', 'Diagnostician']);

    // Nurse
    await pool.query('INSERT INTO nurses (user_id, name) VALUES ($1, $2)', [userMap['nurse_joy'].id, 'Joy']);

    // Patients
    await pool.query('INSERT INTO patients (user_id, name, dob, address) VALUES ($1, $2, $3, $4)', [userMap['jdoe'].id, 'John Doe', '1980-01-01', '123 Main St']);
    await pool.query('INSERT INTO patients (user_id, name, dob, address) VALUES ($1, $2, $3, $4)', [userMap['asmith'].id, 'Alice Smith', '1990-05-15', '456 Oak Ave']);

    // Seed Appointments
    // 1. Pending
    await pool.query('INSERT INTO appointments (patient_id, doctor_id, status, reason) VALUES ($1, $2, $3, $4)', [userMap['jdoe'].id, userMap['dr_house'].id, 'pending', 'Leg pain']);

    // 2. Accepted
    const app2 = await pool.query('INSERT INTO appointments (patient_id, doctor_id, status, reason) VALUES ($1, $2, $3, $4) RETURNING id', [userMap['asmith'].id, userMap['dr_house'].id, 'accepted', 'Flu symptoms']);

    // 3. Completed with Diagnosis and Meds
    const app3 = await pool.query('INSERT INTO appointments (patient_id, doctor_id, status, reason) VALUES ($1, $2, $3, $4) RETURNING id', [userMap['jdoe'].id, userMap['dr_house'].id, 'completed', 'Migraine']);

    // Diagnosis
    await pool.query('INSERT INTO diagnoses (appointment_id, doctor_id, description) VALUES ($1, $2, $3)', [app3.rows[0].id, userMap['dr_house'].id, 'Chronic Migraine']);

    // Medication
    await pool.query('INSERT INTO medications (appointment_id, nurse_id, patient_id, drug_name, dosage) VALUES ($1, $2, $3, $4, $5)', [app3.rows[0].id, userMap['nurse_joy'].id, userMap['jdoe'].id, 'Sumatriptan', '50mg']);

    console.log('Database seeded successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

seed();

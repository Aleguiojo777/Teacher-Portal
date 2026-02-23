#!/usr/bin/env node

/**
 * SECURE ADMIN CREATION SCRIPT
 * 
 * Use this script to create the main administrator account.
 * This should only be run by system administrators or during initial setup.
 * 
 * Usage: node create_main_admin.js
 */

const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const readline = require('readline');

// Database path
const dbPath = path.join(__dirname, '../database/teacher_portal.db');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

async function createMainAdmin() {
  console.log('\n' + '='.repeat(60));
  console.log('SECURE MAIN ADMINISTRATOR CREATION');
  console.log('='.repeat(60) + '\n');

  try {
    // Get admin details from user
    const fullName = await question('Full Name: ');
    const email = await question('Email Address: ');
    const password1 = await question('Password (min 8 chars): ');
    const password2 = await question('Confirm Password: ');

    // Validation
    if (!fullName || !email || !password1 || !password2) {
      console.error('\n[ERROR] All fields are required');
      rl.close();
      process.exit(1);
    }

    if (password1 !== password2) {
      console.error('\n[ERROR] Passwords do not match');
      rl.close();
      process.exit(1);
    }

    if (password1.length < 8) {
      console.error('\n[ERROR] Password must be at least 8 characters');
      rl.close();
      process.exit(1);
    }

    if (!email.includes('@')) {
      console.error('\n[ERROR] Invalid email address');
      rl.close();
      process.exit(1);
    }

    // Open database
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('\n[ERROR] Database connection failed:', err.message);
        rl.close();
        process.exit(1);
      }

      // Check if admin already exists
      db.get('SELECT id FROM admins WHERE email = ?', [email], async (err, row) => {
        if (err) {
          console.error('\n[ERROR] Database query failed:', err.message);
          db.close();
          rl.close();
          process.exit(1);
        }

        if (row) {
          console.error('\n[ERROR] Admin with this email already exists');
          db.close();
          rl.close();
          process.exit(1);
        }

        // Hash password
        try {
          const hashedPassword = await bcrypt.hash(password1, 10);
          
          // Insert main admin
          const sql = 'INSERT INTO admins (fullName, email, password, isAdmin, isMain) VALUES (?, ?, ?, ?, ?)';
          db.run(sql, [fullName, email, hashedPassword, 1, 1], function(insertErr) {
            if (insertErr) {
              console.error('\n[ERROR] Failed to create admin:', insertErr.message);
              db.close();
              rl.close();
              process.exit(1);
            }

            console.log('\n' + '='.repeat(60));
            console.log('[SUCCESS] Main Administrator Created!');
            console.log('='.repeat(60));
            console.log(`Admin ID: ${this.lastID}`);
            console.log(`Name: ${fullName}`);
            console.log(`Email: ${email}`);
            console.log(`Role: Main Administrator (isMain=1, isAdmin=1)`);
            console.log('\n[INFO] You can now login and create additional users');
            console.log('='.repeat(60) + '\n');

            db.close();
            rl.close();
            process.exit(0);
          });
        } catch (hashErr) {
          console.error('\n[ERROR] Password hashing failed:', hashErr.message);
          db.close();
          rl.close();
          process.exit(1);
        }
      });
    });
  } catch (error) {
    console.error('\n[ERROR] Unexpected error:', error.message);
    rl.close();
    process.exit(1);
  }
}

// Run the script
createMainAdmin();

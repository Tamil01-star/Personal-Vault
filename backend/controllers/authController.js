import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'vault_default_jwt_secret_token_192837465';

// Memory store for OTPs (Mobile Number -> { otp, expiresAt })
const otpStore = new Map();

/**
 * Register User
 */
export async function register(req, res) {
  const { username, mobile_number, password } = req.body;
  
  if (!username || !mobile_number || !password) {
    return res.status(400).json({ error: 'All fields (username, mobile number, password) are required.' });
  }
  
  try {
    // Check if user or mobile exists
    const checkUser = await pool.query(
      'SELECT id FROM users WHERE username = $1 OR mobile_number = $2',
      [username, mobile_number]
    );
    
    if (checkUser.rows.length > 0) {
      return res.status(400).json({ error: 'Username or mobile number is already registered.' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    // Insert user
    const newUser = await pool.query(
      'INSERT INTO users (username, mobile_number, password_hash) VALUES ($1, $2, $3) RETURNING id, username, mobile_number, created_at',
      [username, mobile_number, passwordHash]
    );
    
    const user = newUser.rows[0];
    
    // Generate token
    const token = jwt.sign({ id: user.id, username: user.username, mobile_number: user.mobile_number }, JWT_SECRET, { expiresIn: '7d' });
    
    return res.status(201).json({
      message: 'Registration successful!',
      token,
      user
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Internal server error occurred.' });
  }
}

/**
 * Login User (supports username or mobile number)
 */
export async function login(req, res) {
  const { usernameOrMobile, password } = req.body;
  
  if (!usernameOrMobile || !password) {
    return res.status(400).json({ error: 'Username/Mobile and Password are required.' });
  }
  
  try {
    // Find user by username or mobile
    const findUser = await pool.query(
      'SELECT * FROM users WHERE username = $1 OR mobile_number = $2',
      [usernameOrMobile, usernameOrMobile]
    );
    
    if (findUser.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username/mobile number or password.' });
    }
    
    const user = findUser.rows[0];
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username/mobile number or password.' });
    }
    
    // Generate token
    const token = jwt.sign({ id: user.id, username: user.username, mobile_number: user.mobile_number }, JWT_SECRET, { expiresIn: '7d' });
    
    return res.status(200).json({
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        username: user.username,
        mobile_number: user.mobile_number,
        created_at: user.created_at
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error occurred.' });
  }
}

/**
 * Forgot Password - Send OTP
 */
export async function forgotPassword(req, res) {
  const { mobile_number } = req.body;
  
  if (!mobile_number) {
    return res.status(400).json({ error: 'Mobile number is required.' });
  }
  
  try {
    const findUser = await pool.query('SELECT id FROM users WHERE mobile_number = $1', [mobile_number]);
    if (findUser.rows.length === 0) {
      return res.status(404).json({ error: 'Mobile number not registered.' });
    }
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes expiry
    
    // Save to memory store
    otpStore.set(mobile_number, { otp, expiresAt });
    
    console.log(`[OTP Verification Code for ${mobile_number}]: ${otp}`);
    
    return res.status(200).json({
      message: 'OTP sent successfully (simulated). Check your console or use the returned code.',
      otp // Returning it for easy simulation in frontend
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ error: 'Internal server error occurred.' });
  }
}

/**
 * Reset Password with OTP
 */
export async function resetPassword(req, res) {
  const { mobile_number, otp, new_password } = req.body;
  
  if (!mobile_number || !otp || !new_password) {
    return res.status(400).json({ error: 'All fields (mobile number, OTP, new password) are required.' });
  }
  
  try {
    const record = otpStore.get(mobile_number);
    
    if (!record) {
      return res.status(400).json({ error: 'No OTP requested for this mobile number.' });
    }
    
    if (Date.now() > record.expiresAt) {
      otpStore.delete(mobile_number);
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }
    
    if (record.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP code. Please try again.' });
    }
    
    // OTP matches, update password
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(new_password, salt);
    
    await pool.query('UPDATE users SET password_hash = $1 WHERE mobile_number = $2', [newPasswordHash, mobile_number]);
    
    // Clear OTP
    otpStore.delete(mobile_number);
    
    return res.status(200).json({ message: 'Password has been reset successfully.' });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ error: 'Internal server error occurred.' });
  }
}

/**
 * Change Password (Authenticated user)
 */
export async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;
  
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new password are required.' });
  }
  
  try {
    const findUser = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    const user = findUser.rows[0];
    
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect current password.' });
    }
    
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);
    
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newPasswordHash, userId]);
    
    return res.status(200).json({ message: 'Password changed successfully.' });
  } catch (err) {
    console.error('Change password error:', err);
    return res.status(500).json({ error: 'Internal server error occurred.' });
  }
}

/**
 * Get User Profile info & stats
 */
export async function getStats(req, res) {
  const userId = req.user.id;
  try {
    const pwCount = await pool.query('SELECT COUNT(*) FROM passwords WHERE user_id = $1', [userId]);
    const notesCount = await pool.query('SELECT COUNT(*) FROM notes WHERE user_id = $1', [userId]);
    const diaryCount = await pool.query('SELECT COUNT(*) FROM diary_entries WHERE user_id = $1', [userId]);
    const lettersCount = await pool.query('SELECT COUNT(*) FROM letters WHERE user_id = $1', [userId]);
    const filesCount = await pool.query('SELECT COUNT(*) FROM files WHERE user_id = $1', [userId]);
    
    return res.status(200).json({
      stats: {
        passwords: parseInt(pwCount.rows[0].count),
        notes: parseInt(notesCount.rows[0].count),
        diary: parseInt(diaryCount.rows[0].count),
        letters: parseInt(lettersCount.rows[0].count),
        files: parseInt(filesCount.rows[0].count)
      }
    });
  } catch (err) {
    console.error('Get stats error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

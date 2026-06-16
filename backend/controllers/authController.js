import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { getFirebaseAuth } from '../config/firebase.js';
import { sendOtpEmail, sendResetLinkEmail } from '../config/email.js';

const JWT_SECRET = process.env.JWT_SECRET || 'vault_secure_jwt_secret_token_192837465_vault';

// Memory store for OTPs (Email -> { otp, expiresAt })
const otpStore = new Map();

/**
 * Register User
 */
export async function register(req, res) {
  const { username, email, mobile_number, password } = req.body;
  
  if (!username || !email || !mobile_number || !password) {
    return res.status(400).json({ error: 'All fields (username, email, mobile number, password) are required.' });
  }
  
  try {
    // Check if user, email or mobile exists
    const checkUser = await pool.query(
      'SELECT id FROM users WHERE username = $1 OR mobile_number = $2 OR email = $3',
      [username, mobile_number, email]
    );
    
    if (checkUser.rows.length > 0) {
      return res.status(400).json({ error: 'Username, email, or mobile number is already registered.' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    // Insert user
    const newUser = await pool.query(
      'INSERT INTO users (username, email, mobile_number, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, username, email, mobile_number, created_at',
      [username, email, mobile_number, passwordHash]
    );
    
    const user = newUser.rows[0];

    // Create user in Firebase Auth
    try {
      await getFirebaseAuth().createUser({
        uid: user.id.toString(),
        email: email,
        password: password,
        displayName: username
      });
    } catch (fbErr) {
      console.log('Firebase user creation info/error on registration:', fbErr.message);
    }
    
    // Generate token
    const token = jwt.sign({ id: user.id, username: user.username, email: user.email, mobile_number: user.mobile_number }, JWT_SECRET, { expiresIn: '7d' });
    
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
 * Login User (supports username, email, or mobile number)
 */
export async function login(req, res) {
  const { usernameOrMobile, password } = req.body;
  
  if (!usernameOrMobile || !password) {
    return res.status(400).json({ error: 'Username/Email/Mobile and Password are required.' });
  }
  
  try {
    // Find user by username, email, or mobile
    const findUser = await pool.query(
      'SELECT * FROM users WHERE username = $1 OR email = $1 OR mobile_number = $1',
      [usernameOrMobile]
    );
    
    if (findUser.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid login credentials.' });
    }
    
    const user = findUser.rows[0];
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid login credentials.' });
    }
    
    // Generate token
    const token = jwt.sign({ id: user.id, username: user.username, email: user.email, mobile_number: user.mobile_number }, JWT_SECRET, { expiresIn: '7d' });
    
    return res.status(200).json({
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
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
 * Forgot Password - Send OTP via Email
 */
export async function forgotPassword(req, res) {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email address is required.' });
  }
  
  try {
    const findUser = await pool.query('SELECT id, username FROM users WHERE email = $1', [email]);
    if (findUser.rows.length === 0) {
      return res.status(404).json({ error: 'This email address is not registered.' });
    }

    const dbUser = findUser.rows[0];
    
    // Ensure the user exists in Firebase Authentication
    try {
      await getFirebaseAuth().getUserByEmail(email);
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        console.log(`Syncing user ${dbUser.username} with Firebase Authentication dynamically...`);
        await getFirebaseAuth().createUser({
          uid: dbUser.id.toString(),
          email: email,
          displayName: dbUser.username
        });
      } else {
        throw err;
      }
    }

    // Generate a 6-digit numeric OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Cache the OTP code in memory store (valid for 10 minutes)
    otpStore.set(email, {
      otp: otpCode,
      expiresAt: Date.now() + 10 * 60 * 1000
    });
    console.log(`[OTP] Generated verification code for ${email}: ${otpCode}`);

    // Send the OTP via Resend
    await sendOtpEmail(email, otpCode);
    
    return res.status(200).json({
      message: 'OTP verification code sent to your email address successfully!',
      useFirebaseClient: false,
      flow: 'otp'
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error occurred.' });
  }
}

/**
 * Verify OTP Code
 */
export async function verifyOtp(req, res) {
  const { email, otp } = req.body;
  
  if (!email || !otp) {
    return res.status(400).json({ error: 'Email address and OTP code are required.' });
  }
  
  try {
    const record = otpStore.get(email);
    
    if (!record) {
      return res.status(400).json({ error: 'No OTP requested for this email address.' });
    }
    
    if (Date.now() > record.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }
    
    if (record.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP code. Please check your email and try again.' });
    }
    
    // Mark OTP as verified
    record.verified = true;
    otpStore.set(email, record);
    
    return res.status(200).json({ message: 'OTP verified successfully. You can now set your new password.' });
  } catch (err) {
    console.error('Verify OTP error:', err);
    return res.status(500).json({ error: 'Internal server error occurred.' });
  }
}

/**
 * Reset Password with OTP
 */
export async function resetPassword(req, res) {
  const { email, otp, new_password } = req.body;
  
  if (!email || !otp || !new_password) {
    return res.status(400).json({ error: 'All fields (email, OTP, new password) are required.' });
  }
  
  try {
    const record = otpStore.get(email);
    
    if (!record) {
      return res.status(400).json({ error: 'No OTP requested for this email address.' });
    }
    
    if (Date.now() > record.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }
    
    if (record.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP code. Please check your email and try again.' });
    }
    
    if (!record.verified) {
      return res.status(400).json({ error: 'OTP has not been verified yet.' });
    }
    
    // OTP matches and is verified, update password in PostgreSQL
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(new_password, salt);
    
    const updateRes = await pool.query(
      'UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING id', 
      [newPasswordHash, email]
    );
    
    if (updateRes.rows.length > 0) {
      const userId = updateRes.rows[0].id.toString();
      // Synchronize new password to Firebase Auth dynamically
      try {
        await getFirebaseAuth().updateUser(userId, { password: new_password });
        console.log(`Successfully synchronized password for user ${userId} to Firebase Auth.`);
      } catch (fbErr) {
        console.log(`Firebase password sync error for user ${userId}:`, fbErr.message);
      }
    }
    
    // Clear OTP
    otpStore.delete(email);
    
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

/**
 * Update User Profile (username, email, mobile_number)
 */
export async function updateProfile(req, res) {
  const userId = req.user.id;
  const { username, email, mobile_number } = req.body;

  if (!username || !email || !mobile_number) {
    return res.status(400).json({ error: 'Username, email, and mobile number are required.' });
  }

  try {
    // Check if the username, email, or mobile number is already taken by another user
    const checkUser = await pool.query(
      'SELECT id FROM users WHERE (username = $1 OR email = $2 OR mobile_number = $3) AND id != $4',
      [username, email, mobile_number, userId]
    );

    if (checkUser.rows.length > 0) {
      return res.status(400).json({ error: 'Username, email, or mobile number is already registered to another account.' });
    }

    // Update user
    const updatedUserRes = await pool.query(
      'UPDATE users SET username = $1, email = $2, mobile_number = $3 WHERE id = $4 RETURNING id, username, email, mobile_number, created_at',
      [username, email, mobile_number, userId]
    );

    if (updatedUserRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = updatedUserRes.rows[0];

    // Generate a new token with updated information
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, mobile_number: user.mobile_number },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      message: 'Profile updated successfully!',
      token,
      user
    });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ error: 'Internal server error occurred.' });
  }
}


/**
 * Reset Password with Firebase Auth ID Token
 */
export async function resetPasswordFirebase(req, res) {
  const { idToken, mobile_number, new_password } = req.body;
  
  if (!idToken || !mobile_number || !new_password) {
    return res.status(400).json({ error: 'All fields (idToken, mobile number, new password) are required.' });
  }
  
  try {
    // 1. Verify the ID Token with Firebase
    const decodedToken = await getFirebaseAuth().verifyIdToken(idToken);
    
    // 2. Extract verified phone number from token
    const verifiedPhone = decodedToken.phone_number; // Format: "+919876543210"
    
    if (!verifiedPhone) {
      return res.status(400).json({ error: 'Verification token is invalid (no phone number found).' });
    }
    
    // 3. Normalize numbers to compare them
    const verifiedDigits = verifiedPhone.replace(/\D/g, ''); // e.g. "919876543210"
    const inputDigits = mobile_number.replace(/\D/g, '');     // e.g. "9876543210"
    
    if (!verifiedDigits.endsWith(inputDigits)) {
      return res.status(400).json({ error: 'The verified phone number does not match your entered number.' });
    }
    
    // 4. Update the password in PostgreSQL DB
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(new_password, salt);
    
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE mobile_number = $2',
      [newPasswordHash, mobile_number]
    );
    
    return res.status(200).json({ message: 'Password has been reset successfully.' });
  } catch (err) {
    console.error('Firebase token verification failed:', err);
    return res.status(401).json({ error: 'Invalid or expired SMS OTP token. Please try again.' });
  }
}

/**
 * Reset Password with Firebase Auth ID Token (for Email link password resets)
 */
export async function resetPasswordFirebaseEmail(req, res) {
  const { idToken, new_password } = req.body;

  if (!idToken || !new_password) {
    return res.status(400).json({ error: 'All fields (idToken, new password) are required.' });
  }

  try {
    // 1. Verify the ID Token with Firebase
    const decodedToken = await getFirebaseAuth().verifyIdToken(idToken);
    
    // 2. Extract verified email from token
    const verifiedEmail = decodedToken.email;
    
    if (!verifiedEmail) {
      return res.status(400).json({ error: 'Verification token is invalid (no email address found).' });
    }
    
    // 3. Update the password in PostgreSQL DB
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(new_password, salt);
    
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE email = $2',
      [newPasswordHash, verifiedEmail]
    );
    
    return res.status(200).json({ message: 'Password has been reset successfully.' });
  } catch (err) {
    console.error('Firebase email ID token verification failed:', err);
    return res.status(401).json({ error: 'Invalid or expired Firebase email token. Please try again.' });
  }
}

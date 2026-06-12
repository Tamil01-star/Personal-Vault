import pool from '../config/db.js';
import { encrypt, decrypt } from '../config/crypto.js';

/**
 * Get all password records for user
 */
export async function getPasswords(req, res) {
  const userId = req.user.id;
  const { category, search } = req.query;
  
  try {
    let query = 'SELECT * FROM passwords WHERE user_id = $1';
    const params = [userId];
    
    if (category) {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }
    
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (website_name ILIKE $${params.length} OR username ILIKE $${params.length} OR category ILIKE $${params.length} OR notes ILIKE $${params.length})`;
    }
    
    query += ' ORDER BY website_name ASC';
    
    const result = await pool.query(query, params);
    
    // Decrypt passwords for the user
    const records = result.rows.map(row => {
      try {
        return {
          ...row,
          password: decrypt(row.encrypted_password)
        };
      } catch (err) {
        return {
          ...row,
          password: '[Decryption Error]'
        };
      }
    });
    
    return res.status(200).json(records);
  } catch (err) {
    console.error('Get passwords error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * Get password record by ID
 */
export async function getPasswordById(req, res) {
  const userId = req.user.id;
  const { id } = req.params;
  
  try {
    const result = await pool.query('SELECT * FROM passwords WHERE id = $1 AND user_id = $2', [id, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Password record not found.' });
    }
    
    const row = result.rows[0];
    row.password = decrypt(row.encrypted_password);
    
    return res.status(200).json(row);
  } catch (err) {
    console.error('Get password by ID error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * Create a password record
 */
export async function createPassword(req, res) {
  const userId = req.user.id;
  const { website_name, username, password, category, notes } = req.body;
  
  if (!website_name || !username || !password) {
    return res.status(400).json({ error: 'Website/App Name, Username, and Password are required.' });
  }
  
  try {
    const encrypted = encrypt(password);
    
    const result = await pool.query(
      'INSERT INTO passwords (user_id, website_name, username, encrypted_password, category, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [userId, website_name, username, encrypted, category || 'General', notes || '']
    );
    
    const newRecord = result.rows[0];
    newRecord.password = password;
    
    return res.status(201).json({
      message: 'Password record saved successfully.',
      record: newRecord
    });
  } catch (err) {
    console.error('Create password error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * Update a password record
 */
export async function updatePassword(req, res) {
  const userId = req.user.id;
  const { id } = req.params;
  const { website_name, username, password, category, notes } = req.body;
  
  if (!website_name || !username || !password) {
    return res.status(400).json({ error: 'Website/App Name, Username, and Password are required.' });
  }
  
  try {
    // Check ownership
    const checkResult = await pool.query('SELECT id FROM passwords WHERE id = $1 AND user_id = $2', [id, userId]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Password record not found or unauthorized.' });
    }
    
    const encrypted = encrypt(password);
    
    const result = await pool.query(
      'UPDATE passwords SET website_name = $1, username = $2, encrypted_password = $3, category = $4, notes = $5, updated_at = NOW() WHERE id = $6 RETURNING *',
      [website_name, username, encrypted, category || 'General', notes || '', id]
    );
    
    const updatedRecord = result.rows[0];
    updatedRecord.password = password;
    
    return res.status(200).json({
      message: 'Password record updated successfully.',
      record: updatedRecord
    });
  } catch (err) {
    console.error('Update password error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * Delete a password record
 */
export async function deletePassword(req, res) {
  const userId = req.user.id;
  const { id } = req.params;
  
  try {
    const checkResult = await pool.query('SELECT id FROM passwords WHERE id = $1 AND user_id = $2', [id, userId]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Password record not found or unauthorized.' });
    }
    
    await pool.query('DELETE FROM passwords WHERE id = $1', [id]);
    
    return res.status(200).json({ message: 'Password record permanently deleted.' });
  } catch (err) {
    console.error('Delete password error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

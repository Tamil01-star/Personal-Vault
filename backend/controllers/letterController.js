import pool from '../config/db.js';

/**
 * Get all letters for user
 */
export async function getLetters(req, res) {
  const userId = req.user.id;
  const { search, status } = req.query;
  
  try {
    let query = 'SELECT * FROM letters WHERE user_id = $1';
    const params = [userId];
    
    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }
    
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (title ILIKE $${params.length} OR content ILIKE $${params.length})`;
    }
    
    query += ' ORDER BY updated_at DESC';
    
    const result = await pool.query(query, params);
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('Get letters error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * Get letter by ID
 */
export async function getLetterById(req, res) {
  const userId = req.user.id;
  const { id } = req.params;
  
  try {
    const result = await pool.query('SELECT * FROM letters WHERE id = $1 AND user_id = $2', [id, userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Letter not found.' });
    }
    return res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Get letter by ID error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * Create a letter
 */
export async function createLetter(req, res) {
  const userId = req.user.id;
  const { title, content, status } = req.body;
  
  if (!title) {
    return res.status(400).json({ error: 'Title is required.' });
  }
  
  try {
    const result = await pool.query(
      'INSERT INTO letters (user_id, title, content, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, title, content || '', status || 'draft']
    );
    return res.status(201).json({
      message: 'Letter saved successfully.',
      letter: result.rows[0]
    });
  } catch (err) {
    console.error('Create letter error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * Update a letter
 */
export async function updateLetter(req, res) {
  const userId = req.user.id;
  const { id } = req.params;
  const { title, content, status } = req.body;
  
  if (!title) {
    return res.status(400).json({ error: 'Title is required.' });
  }
  
  try {
    const checkResult = await pool.query('SELECT id FROM letters WHERE id = $1 AND user_id = $2', [id, userId]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Letter not found or unauthorized.' });
    }
    
    const result = await pool.query(
      'UPDATE letters SET title = $1, content = $2, status = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
      [title, content || '', status || 'draft', id]
    );
    
    return res.status(200).json({
      message: 'Letter updated successfully.',
      letter: result.rows[0]
    });
  } catch (err) {
    console.error('Update letter error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * Delete a letter
 */
export async function deleteLetter(req, res) {
  const userId = req.user.id;
  const { id } = req.params;
  
  try {
    const checkResult = await pool.query('SELECT id FROM letters WHERE id = $1 AND user_id = $2', [id, userId]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Letter not found or unauthorized.' });
    }
    
    await pool.query('DELETE FROM letters WHERE id = $1', [id]);
    return res.status(200).json({ message: 'Letter permanently deleted.' });
  } catch (err) {
    console.error('Delete letter error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

import pool from '../config/db.js';

/**
 * Get all notes for user
 */
export async function getNotes(req, res) {
  const userId = req.user.id;
  const { search } = req.query;
  
  try {
    let query = 'SELECT * FROM notes WHERE user_id = $1';
    const params = [userId];
    
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (title ILIKE $2 OR content ILIKE $2)`;
    }
    
    query += ' ORDER BY updated_at DESC';
    
    const result = await pool.query(query, params);
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('Get notes error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * Get note by ID
 */
export async function getNoteById(req, res) {
  const userId = req.user.id;
  const { id } = req.params;
  
  try {
    const result = await pool.query('SELECT * FROM notes WHERE id = $1 AND user_id = $2', [id, userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found.' });
    }
    return res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Get note by ID error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * Create a note
 */
export async function createNote(req, res) {
  const userId = req.user.id;
  const { title, content } = req.body;
  
  if (!title) {
    return res.status(400).json({ error: 'Title is required.' });
  }
  
  try {
    const result = await pool.query(
      'INSERT INTO notes (user_id, title, content) VALUES ($1, $2, $3) RETURNING *',
      [userId, title, content || '']
    );
    return res.status(201).json({
      message: 'Note created successfully.',
      note: result.rows[0]
    });
  } catch (err) {
    console.error('Create note error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * Update a note
 */
export async function updateNote(req, res) {
  const userId = req.user.id;
  const { id } = req.params;
  const { title, content } = req.body;
  
  if (!title) {
    return res.status(400).json({ error: 'Title is required.' });
  }
  
  try {
    const checkResult = await pool.query('SELECT id FROM notes WHERE id = $1 AND user_id = $2', [id, userId]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found or unauthorized.' });
    }
    
    const result = await pool.query(
      'UPDATE notes SET title = $1, content = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [title, content || '', id]
    );
    
    return res.status(200).json({
      message: 'Note updated successfully.',
      note: result.rows[0]
    });
  } catch (err) {
    console.error('Update note error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * Delete a note
 */
export async function deleteNote(req, res) {
  const userId = req.user.id;
  const { id } = req.params;
  
  try {
    const checkResult = await pool.query('SELECT id FROM notes WHERE id = $1 AND user_id = $2', [id, userId]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found or unauthorized.' });
    }
    
    await pool.query('DELETE FROM notes WHERE id = $1', [id]);
    return res.status(200).json({ message: 'Note permanently deleted.' });
  } catch (err) {
    console.error('Delete note error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

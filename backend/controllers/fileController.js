import pool from '../config/db.js';

/**
 * Get list of files (excluding base64 file_data for performance)
 */
export async function getFiles(req, res) {
  const userId = req.user.id;
  const { search } = req.query;
  
  try {
    let query = 'SELECT id, filename, file_type, file_size, created_at FROM files WHERE user_id = $1';
    const params = [userId];
    
    if (search) {
      params.push(`%${search}%`);
      query += ` AND filename ILIKE $2`;
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, params);
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('Get files error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * Get file details including base64 file_data
 */
export async function getFileById(req, res) {
  const userId = req.user.id;
  const { id } = req.params;
  
  try {
    const result = await pool.query('SELECT * FROM files WHERE id = $1 AND user_id = $2', [id, userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'File not found.' });
    }
    return res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Get file by ID error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * Upload a file (using multer buffer)
 */
export async function uploadFile(req, res) {
  const userId = req.user.id;
  
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }
  
  const { originalname, mimetype, size, buffer } = req.file;
  
  // Max file size: 10MB (to prevent heap exhaustion when processing base64)
  if (size > 10 * 1024 * 1024) {
    return res.status(400).json({ error: 'File size exceeds 10MB limit.' });
  }
  
  try {
    const base64Data = buffer.toString('base64');
    
    const result = await pool.query(
      'INSERT INTO files (user_id, filename, file_type, file_size, file_data) VALUES ($1, $2, $3, $4, $5) RETURNING id, filename, file_type, file_size, created_at',
      [userId, originalname, mimetype, size, base64Data]
    );
    
    return res.status(201).json({
      message: 'File uploaded successfully.',
      file: result.rows[0]
    });
  } catch (err) {
    console.error('Upload file error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * Rename a file
 */
export async function renameFile(req, res) {
  const userId = req.user.id;
  const { id } = req.params;
  const { filename } = req.body;
  
  if (!filename) {
    return res.status(400).json({ error: 'New filename is required.' });
  }
  
  try {
    const checkResult = await pool.query('SELECT id FROM files WHERE id = $1 AND user_id = $2', [id, userId]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'File not found or unauthorized.' });
    }
    
    const result = await pool.query(
      'UPDATE files SET filename = $1 WHERE id = $2 RETURNING id, filename, file_type, file_size, created_at',
      [filename, id]
    );
    
    return res.status(200).json({
      message: 'File renamed successfully.',
      file: result.rows[0]
    });
  } catch (err) {
    console.error('Rename file error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * Delete a file
 */
export async function deleteFile(req, res) {
  const userId = req.user.id;
  const { id } = req.params;
  
  try {
    const checkResult = await pool.query('SELECT id FROM files WHERE id = $1 AND user_id = $2', [id, userId]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'File not found or unauthorized.' });
    }
    
    await pool.query('DELETE FROM files WHERE id = $1', [id]);
    return res.status(200).json({ message: 'File permanently deleted.' });
  } catch (err) {
    console.error('Delete file error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

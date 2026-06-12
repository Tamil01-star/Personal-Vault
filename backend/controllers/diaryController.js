import pool from '../config/db.js';

/**
 * Get diary entries for user
 */
export async function getDiaryEntries(req, res) {
  const userId = req.user.id;
  const { month, year, search, date } = req.query;
  
  try {
    let query = 'SELECT * FROM diary_entries WHERE user_id = $1';
    const params = [userId];
    
    if (date) {
      params.push(date);
      query += ` AND entry_date = $${params.length}`;
    } else if (month && year) {
      // Filter by month/year (useful for calendar view)
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = new Date(year, month, 0).getDate(); // last day of month
      const endDateStr = `${year}-${String(month).padStart(2, '0')}-${endDate}`;
      
      params.push(startDate, endDateStr);
      query += ` AND entry_date BETWEEN $2 AND $3`;
    }
    
    if (search) {
      params.push(`%${search}%`);
      query += ` AND content ILIKE $${params.length}`;
    }
    
    query += ' ORDER BY entry_date DESC';
    
    const result = await pool.query(query, params);
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('Get diary entries error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * Create or Update (Upsert) a diary entry
 */
export async function saveDiaryEntry(req, res) {
  const userId = req.user.id;
  const { entry_date, content } = req.body;
  
  if (!entry_date || !content) {
    return res.status(400).json({ error: 'Entry date and content are required.' });
  }
  
  try {
    // Check if entry already exists for that date
    const checkResult = await pool.query(
      'SELECT id FROM diary_entries WHERE user_id = $1 AND entry_date = $2',
      [userId, entry_date]
    );
    
    let result;
    if (checkResult.rows.length > 0) {
      // Update existing
      result = await pool.query(
        'UPDATE diary_entries SET content = $1, updated_at = NOW() WHERE user_id = $2 AND entry_date = $3 RETURNING *',
        [content, userId, entry_date]
      );
    } else {
      // Insert new
      result = await pool.query(
        'INSERT INTO diary_entries (user_id, entry_date, content) VALUES ($1, $2, $3) RETURNING *',
        [userId, entry_date, content]
      );
    }
    
    return res.status(200).json({
      message: 'Diary entry saved successfully.',
      entry: result.rows[0]
    });
  } catch (err) {
    console.error('Save diary entry error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * Delete a diary entry
 */
export async function deleteDiaryEntry(req, res) {
  const userId = req.user.id;
  const { id } = req.params;
  
  try {
    const checkResult = await pool.query('SELECT id FROM diary_entries WHERE id = $1 AND user_id = $2', [id, userId]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Diary entry not found or unauthorized.' });
    }
    
    await pool.query('DELETE FROM diary_entries WHERE id = $1', [id]);
    return res.status(200).json({ message: 'Diary entry permanently deleted.' });
  } catch (err) {
    console.error('Delete diary entry error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

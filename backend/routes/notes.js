import express from 'express';
import { getNotes, getNoteById, createNote, updateNote, deleteNote } from '../controllers/noteController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Protect all note routes
router.use(verifyToken);

router.get('/', getNotes);
router.get('/:id', getNoteById);
router.post('/', createNote);
router.put('/:id', updateNote);
router.delete('/:id', deleteNote);

export default router;

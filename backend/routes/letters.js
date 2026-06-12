import express from 'express';
import { getLetters, getLetterById, createLetter, updateLetter, deleteLetter } from '../controllers/letterController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Protect all letter routes
router.use(verifyToken);

router.get('/', getLetters);
router.get('/:id', getLetterById);
router.post('/', createLetter);
router.put('/:id', updateLetter);
router.delete('/:id', deleteLetter);

export default router;

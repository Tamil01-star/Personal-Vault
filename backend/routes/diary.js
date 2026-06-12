import express from 'express';
import { getDiaryEntries, saveDiaryEntry, deleteDiaryEntry } from '../controllers/diaryController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Protect all diary routes
router.use(verifyToken);

router.get('/', getDiaryEntries);
router.post('/', saveDiaryEntry);
router.delete('/:id', deleteDiaryEntry);

export default router;

import express from 'express';
import { getPasswords, getPasswordById, createPassword, updatePassword, deletePassword } from '../controllers/passwordController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Protect all password routes
router.use(verifyToken);

router.get('/', getPasswords);
router.get('/:id', getPasswordById);
router.post('/', createPassword);
router.put('/:id', updatePassword);
router.delete('/:id', deletePassword);

export default router;

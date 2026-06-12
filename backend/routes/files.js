import express from 'express';
import multer from 'multer';
import { getFiles, getFileById, uploadFile, renameFile, deleteFile } from '../controllers/fileController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Setup multer memory storage (buffers data to memory)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB upload limit
});

// Protect all files routes
router.use(verifyToken);

router.get('/', getFiles);
router.get('/:id', getFileById);
router.post('/upload', upload.single('file'), uploadFile);
router.put('/:id/rename', renameFile);
router.delete('/:id', deleteFile);

export default router;

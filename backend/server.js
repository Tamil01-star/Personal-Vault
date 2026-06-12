import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import passwordRoutes from './routes/passwords.js';
import noteRoutes from './routes/notes.js';
import diaryRoutes from './routes/diary.js';
import letterRoutes from './routes/letters.js';
import fileRoutes from './routes/files.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for all requests (or customize for Next.js frontend on port 3000)
app.use(cors({
  origin: '*', // For local dev, allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsers - parse JSON payloads up to 15MB (due to base64 documents upload)
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));

// Serve static assets if needed
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

app.get('/', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    message: 'Secure Personal Vault API is running.',
    timestamp: new Date()
  });
});

// Register api endpoints
app.use('/api/auth', authRoutes);
app.use('/api/passwords', passwordRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/diary', diaryRoutes);
app.use('/api/letters', letterRoutes);
app.use('/api/files', fileRoutes);

// 404 Route handler
app.use((req, res, next) => {
  res.status(404).json({ error: 'Endpoint not found.' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err.stack);
  res.status(500).json({ error: 'Internal server error occurred.' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`  Secure Personal Vault Backend Server running`);
  console.log(`  Local Address: http://localhost:${PORT}`);
  console.log(`  Environment:   ${process.env.NODE_ENV || 'development'}`);
  console.log(`==================================================`);
});

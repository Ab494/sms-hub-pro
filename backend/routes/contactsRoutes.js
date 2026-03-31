import express from 'express';
import multer from 'multer';
import {
  getContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
  bulkDeleteContacts,
  importContacts,
  getContactCount
} from '../controllers/contactsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Configure multer for CSV upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `contacts-${Date.now()}.csv`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
});

// Ensure uploads directory exists
import fs from 'fs';
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// All routes require authentication
router.use(protect);

// Contact CRUD
router.get('/', getContacts);
router.get('/count', getContactCount);
router.get('/:id', getContact);
router.post('/', createContact);
router.put('/:id', updateContact);
router.delete('/:id', deleteContact);

// Bulk operations
router.post('/bulk-delete', bulkDeleteContacts);
router.post('/import', upload.single('file'), importContacts);

export default router;

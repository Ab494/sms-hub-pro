import express from 'express';
import {
  getGroups,
  getGroup,
  createGroup,
  updateGroup,
  deleteGroup,
  getGroupContacts,
  addContactsToGroup,
  removeContactsFromGroup
} from '../controllers/groupsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Group CRUD
router.get('/', getGroups);
router.get('/:id', getGroup);
router.post('/', createGroup);
router.put('/:id', updateGroup);
router.delete('/:id', deleteGroup);

// Group contacts management
router.get('/:id/contacts', getGroupContacts);
router.post('/:id/contacts', addContactsToGroup);
router.delete('/:id/contacts', removeContactsFromGroup);

export default router;

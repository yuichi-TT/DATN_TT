
import express from 'express';
import {
  getConversations,
  getMessages,
  findOrCreateConversation

} from '../controllers/conversationController';
import { authenticate } from '../middleware/auth'; 

const router = express.Router();

// GET /api/conversations
router.route('/')
        .get(authenticate, getConversations)
        .post(authenticate, findOrCreateConversation);

// GET /api/conversations/:conversationId/messages
router.route('/:conversationId/messages').get(authenticate, getMessages); 

export default router;
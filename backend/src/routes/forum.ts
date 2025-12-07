import { Router } from 'express';

import { 
  getPosts, 
  getPost, 
  createPost, 
  updatePost, 
  deletePost, 
  createReply,
  likePost,
 getMyPosts       
} from '../controllers/forumController';
// =======================================
import { authenticate } from '../middleware/auth';

const router = Router();


// Group routes for /posts
router.route('/posts')
  .get(getPosts)
  .post(authenticate, createPost);

router.get('/posts/my-posts', authenticate, getMyPosts);

// Group routes for /posts/:id
router.route('/posts/:id')
  .get(getPost)
  .put(authenticate, updatePost)
  .delete(authenticate, deletePost);

// Route for creating replies
router.post('/posts/:id/replies', authenticate, createReply);

// Route for liking posts
router.patch('/posts/:id/like', authenticate, likePost); 
// ========================================================

export { router as forumRoutes };
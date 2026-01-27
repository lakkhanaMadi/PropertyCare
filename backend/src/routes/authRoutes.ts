import { Router } from 'express';
import { createUser } from '../controllers/authController';
import { requireAuth } from '@clerk/express';

const router = Router();

router.post("/register",  createUser);


export default router;
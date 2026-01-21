import { Router } from 'express';
import { scheduleEmail, getEmails } from '../controllers/emailController';

const router = Router();

router.post('/', scheduleEmail);
router.get('/', getEmails);

export const emailRouter = router;

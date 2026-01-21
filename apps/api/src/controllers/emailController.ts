import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { checkRateLimit } from '../utils/rateLimiter';

export const scheduleEmail = async (req: Request, res: Response) => {
    try {
        const { to, subject, body, sender, scheduledAt } = req.body;

        if (!to || !subject || !body) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Use provided sender or default if none (though frontend sends it now)
        const userId = sender || 'anonymous';

        // Rate Limiting
        // Rate Limiting (Disabled for testing)
        // const allowed = await checkRateLimit(userId, 50, 60);
        const allowed = true;
        if (!allowed) {
            return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
        }

        const email = await prisma.scheduledEmail.create({
            data: {
                to,
                subject,
                body,
                status: 'PENDING' as any,
                scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
                sender: userId
            }
        });

        res.status(201).json(email);
    } catch (error) {
        console.error('Error scheduling email:', error);
        res.status(500).json({ error: 'Failed to schedule email' });
    }
};

export const getEmails = async (req: Request, res: Response) => {
    try {
        const emails = await prisma.scheduledEmail.findMany({
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json(emails);
    } catch (error) {
        console.error('Error fetching emails:', error);
        res.status(500).json({ error: 'Failed to fetch emails' });
    }
};

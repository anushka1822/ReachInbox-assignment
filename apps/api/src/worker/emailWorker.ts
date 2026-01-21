import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis';
import { sendEmail } from '../utils/emailSender';
import { prisma } from '../lib/prisma';
import { EMAIL_QUEUE_NAME } from '../queue/emailQueue';
import { checkSenderRateLimit } from '../utils/rateLimiter';

interface EmailJobData {
    to: string;
    subject: string;
    body: string;
    scheduledEmailId: string;
    sender?: string;
}

const workerHandler = async (job: Job<EmailJobData>) => {
    const { to, subject, body, scheduledEmailId, sender } = job.data;
    console.log(`Processing job ${job.id} for email ${scheduledEmailId}`);

    // Rate limiting: 10 emails per 1 hour (3600 seconds) per sender
    if (sender) {
        const isRateLimited = await checkSenderRateLimit(sender, 10, 3600);
        if (isRateLimited) {
            console.warn(`Rate limit exceeded for sender ${sender}`);
            throw new Error(`Rate limit exceeded for sender ${sender}`);
        }
    }

    try {
        await sendEmail(to, subject, body);

        // Update DB
        await prisma.scheduledEmail.update({
            where: { id: scheduledEmailId },
            data: { status: 'SENT' as any, sentAt: new Date() },
        });
        console.log(`Email ${scheduledEmailId} sent successfully.`);
    } catch (error: any) {
        console.error(`Failed to send email ${scheduledEmailId}:`, error);
        await prisma.scheduledEmail.update({
            where: { id: scheduledEmailId },
            data: { status: 'FAILED' as any, error: error.message },
        });
        throw error;
    }
};

export const emailWorker = new Worker(EMAIL_QUEUE_NAME, workerHandler, {
    connection: redisConnection,
    concurrency: 5, // Default concurrency
    limiter: {
        max: 100,
        duration: 3600000 // 1 hour global limit as safeguard
    }
});

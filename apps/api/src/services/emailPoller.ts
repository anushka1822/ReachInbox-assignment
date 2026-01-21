import { prisma } from '../lib/prisma';
import { emailQueue } from '../queue/emailQueue';

const BATCH_SIZE = 10;
const POLL_INTERVAL = 5000; // 5 seconds

export const startEmailPoller = () => {
    console.log('Starting Email Poller...');

    const poll = async () => {
        try {
            // Transaction to fetch and mark as PROCESSING atomically
            // Note: Prisma doesn't have a "SELECT FOR UPDATE" natively in the same way, 
            // but we can updateMany where status is PENDING.
            // However, we want to get the IDs to push to queue.
            // A common pattern with Prisma is to query first, then loop, or use raw query.
            // For simplicity and to avoid raw query complexity in this assignment, 
            // we will fetch and then iterate. Validating status check in update.

            const pendingEmails = await prisma.scheduledEmail.findMany({
                where: {
                    status: 'PENDING' as any,
                    scheduledAt: {
                        lte: new Date(),
                    },
                },
                take: BATCH_SIZE,
                orderBy: {
                    scheduledAt: 'asc',
                },
            });

            for (const email of pendingEmails) {
                // Optimistic concurrency check: only process if we can flip it to PROCESSING
                // This prevents race conditions if multiple pollers were running (though we have 1 now)
                const updated = await prisma.scheduledEmail.updateMany({
                    where: {
                        id: email.id,
                        status: 'PENDING' as any,
                    },
                    data: {
                        status: 'PROCESSING' as any,
                    },
                });

                if (updated.count > 0) {
                    console.log(`Queuing email ${email.id}`);
                    await emailQueue.add('send-email', {
                        scheduledEmailId: email.id,
                        to: email.to,
                        subject: email.subject,
                        body: email.body,
                        sender: email.sender || undefined,
                    });
                }
            }
        } catch (error) {
            console.error('Error in email poller:', error);
        } finally {
            setTimeout(poll, POLL_INTERVAL);
        }
    };

    poll();
};

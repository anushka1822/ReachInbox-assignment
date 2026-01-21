import nodemailer from 'nodemailer';

// Create a reusable transporter object using the default SMTP transport
// We will initialize it lazily or use environment variables
let transporter: nodemailer.Transporter | null = null;

export const getTransporter = async () => {
    if (transporter) return transporter;

    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing
    // In production, user would provide credentials.
    // For this assignment, we use Ethereal as requested.

    // Check if we have env vars, else generate
    if (process.env.ETHEREAL_USER && process.env.ETHEREAL_PASS) {
        transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.ETHEREAL_USER,
                pass: process.env.ETHEREAL_PASS,
            },
        });
    } else {
        console.log('Generating new Ethereal credentials...');
        const testAccount = await nodemailer.createTestAccount();
        console.log('Ethereal Credentials:', testAccount.user, testAccount.pass);

        transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
    }

    return transporter;
};

export const sendEmail = async (to: string, subject: string, html: string) => {
    const transport = await getTransporter();
    const info = await transport.sendMail({
        from: '"ReachInbox Scheduler" <scheduler@reachinbox.com>',
        to,
        subject,
        html,
    });

    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    return info;
};

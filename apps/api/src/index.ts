import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { emailRouter } from './routes/email.routes';
import { startEmailPoller } from './services/emailPoller';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/emails', emailRouter);

// Start Poller
startEmailPoller();

const PORT = process.env.PORT || 3001;

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

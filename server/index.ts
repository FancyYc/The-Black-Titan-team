import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import emissionsRouter from './routes/emissions';
import reportsRouter from './routes/reports';
import aiRouter from './routes/ai';

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/emissions', emissionsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/ai', aiRouter);

app.listen(PORT, () => {
  console.log(`ESG 백엔드 서버 실행 중 → http://localhost:${PORT}`);
});

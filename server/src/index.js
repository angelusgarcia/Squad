import 'dotenv/config';
import tls from 'node:tls';

// Certificados do Windows (antivírus com inspeção HTTPS)
try {
  if (tls.setDefaultCACertificates && tls.getCACertificates) {
    tls.setDefaultCACertificates([...tls.getCACertificates('default'), ...tls.getCACertificates('system')]);
  }
} catch (err) {
  console.warn('[tls] não foi possível carregar os certificados do sistema:', err.message);
}
import http from 'node:http';
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import gameRoutes from './routes/games.js';
import reviewRoutes from './routes/reviews.js';
import forumRoutes from './routes/forum.js';
import guideRoutes from './routes/guides.js';
import indicationRoutes from './routes/indications.js';
import recommendationRoutes from './routes/recommendations.js';
import communityRoutes from './routes/community.js';
import suggestionRoutes from './routes/suggestions.js';
import { setupSocket } from './socket/index.js';

const app = express();
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(cors({ origin: CLIENT_URL }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/guides', guideRoutes);
app.use('/api/indications', indicationRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/suggestions', suggestionRoutes);

// Tratamento central de erros
app.use((err, _req, res, _next) => {
  if (!err.status) console.error(err);
  res.status(err.status || 500).json({ error: err.status ? err.message : 'Erro interno no servidor.' });
});

const server = http.createServer(app);
setupSocket(server, CLIENT_URL);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`🎮 Squad API rodando em http://localhost:${PORT}`));

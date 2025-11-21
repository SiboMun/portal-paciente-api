import express from 'express';
import cors from 'cors';

import router from '../src/routes/index.routes.js';

const app = express();

app.use(cors({
    origin: [
        "http://localhost:4200",
        "https://portal-paciente-front-44c5.vercel.app",
        "https://portal-paciente-front-8y6f.vercel.app"
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Rutas de la API
app.use('/api', router);

// Exportar como handler serverless (OBLIGATORIO PARA VERCEL)
export default app;

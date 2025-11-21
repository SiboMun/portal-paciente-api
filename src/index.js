import express, { json } from 'express';
import cors from 'cors';
import router from './routes/index.routes.js';

const app = express();

app.use(cors());
app.use(json());
app.use('/api', router);

// Solo local
if (process.env.NODE_ENV !== 'production') {
    const PORT = 3000;
    app.listen(PORT, () => {
        console.log(`🚀 Servidor local v2 en http://localhost:${PORT}`);
    });
}

export default app;

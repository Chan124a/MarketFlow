import Fastify from 'fastify';
import { fetchIndices } from './fetcher.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const fastify = Fastify({ logger: true });

fastify.get('/', async (request, reply) => {
  const html = readFileSync(join(__dirname, 'public', 'index.html'), 'utf-8');
  reply.type('text/html').send(html);
});

fastify.get('/api/indices', async (request, reply) => {
  try {
    const data = await fetchIndices();
    return { success: true, data };
  } catch (error) {
    reply.code(500);
    return { success: false, error: error.message };
  }
});

const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log('Dashboard: http://localhost:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
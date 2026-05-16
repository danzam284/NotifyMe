import index from './index.html'; 
import { apiRouter } from './src/routes/api.ts';

const server = Bun.serve({
  port: 3000,
  routes: {
    "/": index, 
    "/api/*": apiRouter,
  }
});

console.log(`Listening on ${server.url}`);
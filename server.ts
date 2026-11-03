import { CommonEngine, createNodeRequestHandler, isMainModule } from '@angular/ssr/node';
import express from 'express';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const app = express();
const angularApp = new CommonEngine({ allowedHosts: ['localhost', '127.0.0.1'] });
const documentFilePath = resolve('dist/busgo-mobile/server/index.server.html');
const bootstrap = (context: unknown) =>
  import(pathToFileURL(resolve('dist/busgo-mobile/server/main.server.mjs')).href).then((m) => m.default(context));

app.use(async (req, res, next) => {
  try {
    const html = await angularApp.render({
      bootstrap,
      documentFilePath,
      url: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
      publicPath: resolve('dist/busgo-mobile/browser'),
    });
    res.send(html);
  } catch (error) {
    next(error);
  }
});

if (isMainModule(import.meta.url)) {
  const port = Number(process.env['PORT'] || 4000);
  app.listen(port, (error?: Error) => {
    if (error) throw error;
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

export const reqHandler = createNodeRequestHandler(app);

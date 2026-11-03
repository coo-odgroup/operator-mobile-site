import { bootstrapApplication } from '@angular/platform-browser';
import { BootstrapContext } from '@angular/platform-browser';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { App } from './app/app';
import { appConfig } from './app/app.config';
import { serverRoutes } from './app/app.routes';

const serverConfig = {
  ...appConfig,
  providers: [...appConfig.providers, provideServerRendering(withRoutes(serverRoutes))],
};

const bootstrap = (context: BootstrapContext) => bootstrapApplication(App, serverConfig, context);

export default bootstrap;

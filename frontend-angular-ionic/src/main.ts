import { enableProdMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withComponentInputBinding } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';

// Firebase
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideStorage, getStorage } from '@angular/fire/storage';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './app/core/interceptors/auth.interceptor';

import { PLAYER_SERVICE_TOKEN } from './app/core/services/players/player.service.token';
import { NEWS_SERVICE_TOKEN } from './app/core/services/news/news.service.token';
import { AI_SERVICE_TOKEN } from './app/core/services/ai/ai.service.token';

import { PlayerProxyService } from './app/core/services/players/player-proxy.service';
import { NewsProxyService } from './app/core/services/news/news-proxy.service';
import { AIProxyService } from './app/core/services/ai/ai-proxy.service';

if (environment.production) {
  enableProdMode();
}

import { register } from 'swiper/element/bundle';
import { defineCustomElements as defineIonicElements } from '@ionic/pwa-elements/loader';
import { defineCustomElements as defineFootballElements } from '../../stencil-library/loader';

register();
defineIonicElements(window);
defineFootballElements(window);

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage()),
    {
      provide: PLAYER_SERVICE_TOKEN,
      useClass: PlayerProxyService
    },
    {
      provide: NEWS_SERVICE_TOKEN,
      useClass: NewsProxyService
    },
    {
      provide: AI_SERVICE_TOKEN,
      useClass: AIProxyService
    }
  ],
}).catch(err => console.log(err));

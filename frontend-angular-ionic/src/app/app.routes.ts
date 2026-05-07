import { Routes } from '@angular/router';
import { MainLayoutComponent } from './shared/components/main-layout/main-layout.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'login',
    redirectTo: 'auth/login',
    pathMatch: 'full'
  },
  {
    path: 'register',
    redirectTo: 'auth/register',
    pathMatch: 'full'
  },
  {
    path: 'forgot-password',
    redirectTo: 'auth/forgot-password',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadComponent: () => import('./shared/components/auth-layout/auth-layout.component').then((m) => m.AuthLayoutComponent),
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/login/login.page').then((m) => m.LoginPage),
        data: { authTitle: '¡Bienvenido!', authSubtitle: 'Inicia sesión para gestionar tus jugadores.', isLogin: true }
      },
      {
        path: 'register',
        loadComponent: () => import('./features/register/register.page').then((m) => m.RegisterPage),
        data: { authTitle: 'Crear Cuenta', authSubtitle: 'Únete para crear tu liga perfecta.', isLogin: false, showBackButton: true, backHref: '/auth/login' }
      },
      {
        path: 'forgot-password',
        loadComponent: () => import('./features/forgot-password/forgot-password.page').then((m) => m.ForgotPasswordPage),
        data: { authTitle: 'Recuperar Contraseña', authSubtitle: 'Te enviaremos un enlace de recuperación.', isLogin: false, showBackButton: true, backHref: '/auth/login' }
      }
    ]
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'home',
        loadComponent: () => import('./features/home/home.page').then((m) => m.HomePage),
        data: {
          heroTitle: '¡Hola, Alex!',
          heroSubtitle: 'Bienvenido a tu aplicación de fútbol'
        }
      },
      {
        path: 'add-news',
        loadComponent: () => import('./features/admin/add-news/add-news.page').then((m) => m.AddNewsPage),
      },
      {
        path: 'players',
        loadComponent: () => import('./features/players/players.page').then((m) => m.PlayersPage),
      },
      {
        path: 'player-add',
        loadComponent: () => import('./features/players/add-player/add-player.page').then((m) => m.AddPlayerPage),
      },
      {
        path: 'news',
        loadComponent: () => import('./features/news/news.page').then((m) => m.NewsPage),
        data: {
          heroTitle: 'Central de Noticias',
          heroSubtitle: 'Toda la actualidad del fútbol a tu alcance'
        }
      },
      {
        path: 'news/:id',
        loadComponent: () => import('./features/news/news.page').then((m) => m.NewsPage),
      },
      {
        path: 'ai-team',
        loadComponent: () => import('./features/ai-team/ai-team.page').then((m) => m.AiTeamPage),
      }
    ]
  }
];

import { Routes } from '@angular/router';
import { MainLayoutComponent } from './shared/components/main-layout/main-layout.component';
import { authGuard, adminGuard, masterGuard } from './core/guards/auth.guard';

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
      },
      {
        path: 'register',
        loadComponent: () => import('./features/register/register.page').then((m) => m.RegisterPage),
      },
      {
        path: 'forgot-password',
        loadComponent: () => import('./features/forgot-password/forgot-password.page').then((m) => m.ForgotPasswordPage),
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
        loadComponent: () => import('./features/home/home.page').then((m) => m.HomePage)
      },
      {
        path: 'add-news',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/admin/add-edit-news/add-edit-news.page').then((m) => m.AddEditNewsPage),
      },
      {
        path: 'edit-news/:id',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/admin/add-edit-news/add-edit-news.page').then((m) => m.AddEditNewsPage),
      },
      {
        path: 'manage-news',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/admin/manage-news/manage-news.page').then((m) => m.ManageNewsPage),
      },
      {
        path: 'admin-security',
        canActivate: [masterGuard],
        loadComponent: () => import('./features/admin/admin-security/admin-security.page').then((m) => m.AdminSecurityPage),
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
        pathMatch: 'full'
      },
      {
        path: 'news/:id',
        loadComponent: () => import('./features/news-detail/news-detail.page').then(m => m.NewsDetailPage),
        pathMatch: 'full'
      },
      {
        path: 'ai-team',
        loadComponent: () => import('./features/ai-team/ai-team.page').then((m) => m.AiTeamPage),
      }
    ]
  }
];

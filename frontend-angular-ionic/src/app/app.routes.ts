import { Routes } from '@angular/router';
import { MainLayoutComponent } from './shared/components/main-layout/main-layout.component';
import { PublicLayoutComponent } from './shared/components/public-layout/public-layout.component';
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
        loadComponent: () => import('./features/auth/login/login.page').then((m) => m.LoginPage),
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register.page').then((m) => m.RegisterPage),
      },
      {
        path: 'forgot-password',
        loadComponent: () => import('./features/auth/forgot-password/forgot-password.page').then((m) => m.ForgotPasswordPage),
      }
    ]
  },
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      {
        path: 'players-public',
        loadComponent: () => import('./features/players/players-public/players-public.page').then((m) => m.PlayersPublicPage),
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
        loadComponent: () => import('./features/news/add-edit-news/add-edit-news.page').then((m) => m.AddEditNewsPage),
      },
      {
        path: 'edit-news/:id',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/news/add-edit-news/add-edit-news.page').then((m) => m.AddEditNewsPage),
      },
      {
        path: 'manage-news',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/news/manage-news/manage-news.page').then((m) => m.ManageNewsPage),
      },
      {
        path: 'admin-security',
        canActivate: [masterGuard],
        loadComponent: () => import('./features/admin/admin-security/admin-security.page').then((m) => m.AdminSecurityPage),
      },
      {
        path: 'players',
        loadComponent: () => import('./features/players/list-players/players.page').then((m) => m.PlayersPage),
      },
      {
        path: 'player-add',
        loadComponent: () => import('./features/players/add-edit-player/add-edit-player.page').then((m) => m.AddEditPlayerPage),
      },
      {
        path: 'player-edit/:id',
        loadComponent: () => import('./features/players/add-edit-player/add-edit-player.page').then((m) => m.AddEditPlayerPage),
      },
      {
        path: 'player-detail/:id',
        loadComponent: () => import('./features/players/player-detail/player-detail.page').then((m) => m.PlayerDetailPage),
      },
      {
        path: 'news',
        loadComponent: () => import('./features/news/list-news/news.page').then((m) => m.NewsPage),
        pathMatch: 'full'
      },
      {
        path: 'news/:id',
        loadComponent: () => import('./features/news/news-detail/news-detail.page').then(m => m.NewsDetailPage),
        pathMatch: 'full'
      },
      {
        path: 'ai-team',
        loadComponent: () => import('./features/ai-team/ai-team.page').then((m) => m.AiTeamPage),
      },
      {
        path: 'leagues',
        loadComponent: () => import('./features/leagues/leagues-list/leagues-list.page').then((m) => m.LeaguesListPage),
      }
    ]
  }
];

// Touch for recompilation

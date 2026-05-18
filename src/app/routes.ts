import { createBrowserRouter, redirect } from 'react-router';
import { Root } from './pages/Root';
import { AuthPage } from './pages/AuthPage';
import { Home } from './pages/Home';
import { Catalog } from './pages/Catalog';
import { ItemDetail } from './pages/ItemDetail';
import { Statistics } from './pages/Statistics';
import { StyleMatcher } from './pages/StyleMatcher';
import { Chat } from './pages/Chat';
import { AdminPanel } from './pages/AdminPanel';

export const router = createBrowserRouter([
  {
    path: '/auth',
    Component: AuthPage,
  },
  {
    path: '/',
    Component: Root,
    children: [
      {
        index: true,
        loader: () => redirect('/home'),
      },
      {
        path: 'home',
        Component: Home,
      },
      {
        path: 'catalog',
        Component: Catalog,
      },
      {
        path: 'catalog/:id',
        Component: ItemDetail,
      },
      {
        path: 'stats',
        Component: Statistics,
      },
      {
        path: 'style-matcher',
        Component: StyleMatcher,
      },
      {
        path: 'chat',
        Component: Chat,
      },
      {
        path: 'admin',
        Component: AdminPanel,
      },
    ],
  },
]);

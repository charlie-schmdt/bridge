import React from 'react';
import ReactDOM from 'react-dom/client';
import { createHashRouter, RouterProvider } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import { HomeLayout, homeLoader } from './HomeLayout';
import { SettingsLayout } from './SettingsLayout';

const router = createHashRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        loader: homeLoader,
        element: <HomeLayout />,
      },
      {
        path: 'settings',
        element: <SettingsLayout />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

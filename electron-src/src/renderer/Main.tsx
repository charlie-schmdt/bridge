import React from 'react';
import ReactDOM from 'react-dom/client';
import "../index.css";
import { createHashRouter, RouterProvider } from 'react-router-dom';
import { AppLayout } from '@/renderer/AppLayout';
import { HomeLayout, homeLoader } from './HomeLayout';
import { SettingsLayout } from './SettingsLayout';
import { VideoLayout } from './VideoLayout';
import { WorkspaceLayout } from './WorkspaceLayout';
import LogInLayout from './LogInLayout';

// All routes for the app go here
// Every new route must be a child of AppLayout in order to have access to the HeroUIProvider
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
      {
        path: 'video',
        element: <VideoLayout />
      },
      {
        path: 'workspace',
        element: <WorkspaceLayout />
      },
      {
        path: 'login',
        element: <LogInLayout />
      }

    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

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
import  RoomLayout  from './RoomLayout';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

const router = createHashRouter([
  {
    path: "/login",
    element: <LogInLayout />
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        // Default protected route goes to home
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
        path: 'TestRoom',
        element: <RoomLayout />
      }
      ,
      {
        path: 'workspace',
        element: <WorkspaceLayout />
      }
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);
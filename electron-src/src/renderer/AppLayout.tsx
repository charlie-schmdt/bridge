import { Outlet, Link } from 'react-router-dom';
import { HeroUIProvider, Button, Navbar, NavbarBrand, NavbarItem, NavbarContent} from '@heroui/react';
import { ToastContainer } from 'react-toastify';
import OnboardingTour from './components/OnboardingTour';

export const AppLayout = () => {

  // <Outlet /> renders child routes when they are selected
  return (
    <HeroUIProvider>
      <div className="flex flex-col min-h-screen bg-[#f9fafb]">
        <ToastContainer />
        {/* global tour overlay mounts here so it can walk across routes */}
        <OnboardingTour />

        <div className="flex-1 overflow-auto p-4">
          <Outlet />
        </div>
      </div>
    </HeroUIProvider>
  )
}

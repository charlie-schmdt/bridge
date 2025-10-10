import { Outlet, Link } from 'react-router-dom';
import { HeroUIProvider, Button, Navbar, NavbarBrand, NavbarItem, NavbarContent} from '@heroui/react';

export const AppLayout = () => {

  // <Outlet /> renders child routes when they are selected
  return (
        <HeroUIProvider>
      <div className="flex flex-col min-h-screen bg-[#f9fafb]">
        <div className="flex-1 overflow-auto p-4">
          <Outlet />
        </div>
      </div>
    </HeroUIProvider>
  )
}

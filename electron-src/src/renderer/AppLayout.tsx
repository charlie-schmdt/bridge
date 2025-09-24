import { Outlet, Link } from 'react-router-dom';
import { HeroUIProvider, Button, Navbar, NavbarBrand, NavbarItem, NavbarContent} from '@heroui/react';

export const AppLayout = () => {

  // <Outlet /> renders child routes when they are selected
  return (
    <HeroUIProvider>
      <div className="flex flex-col h-screen bg-red-50 p-4 gap-4">
        <Navbar>
          <NavbarBrand className="text-xl font-bold color-red-600">
            <h1>Bridge</h1>
          </NavbarBrand>
          <NavbarContent className="hidden sm:flex gap-4" justify="center">
            <NavbarItem>
              <Button as={Link} to="/">Home</Button>
            </NavbarItem>
            <NavbarItem>
              <Button as={Link} to="/settings">Settings</Button>
            </NavbarItem>
            <NavbarItem>
              <Button as={Link} to="/video">Video</Button>
            </NavbarItem>
          </NavbarContent>
        </Navbar>
      <Outlet />
      </div>
    </HeroUIProvider>
  )
}

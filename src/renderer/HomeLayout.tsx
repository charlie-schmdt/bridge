import { Card, CardBody } from "@heroui/react";
import { useLoaderData } from "react-router-dom";

export const homeLoader = async () => {
  return { message: "Home Page" };
}

export const HomeLayout = () => {
  const { message } = useLoaderData() as { message: string };

  return (
    <Card>
      <CardBody>
        <h1>{message}</h1>
      </CardBody>
      <div className='App'>
        <h1>Bridge</h1>

        <div className='flex-center'>
          Created with React, Rsbuild, and Electron
        </div>
      </div>
    </Card>
  );
}

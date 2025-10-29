import Header from './components/Header';
import Receiver from './components/Receiver';
import Sender from './components/Sender';
import {Card} from "@heroui/react";
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';

export const AudioSandbox = () => {
    return (
        <Card className="min-h-screen bg-gray-50">
          <Header />
          <div className="mt-6 px-6">
            <h1 className="text-3xl font-bold text-gray-900">Audio Sandbox</h1>
          </div>
          <Tabs>
            <TabList className="mt-6 px-6 flex space-x-4 border-b">
              <Tab className="py-2 px-4 cursor-pointer">Sender</Tab>
              <Tab className="py-2 px-4 cursor-pointer">Receiver</Tab>
            </TabList>
            <TabPanel>
              <Sender/>
            </TabPanel>
            <TabPanel>
              <Receiver/>
            </TabPanel>
          </Tabs>
        </Card>
    );
}

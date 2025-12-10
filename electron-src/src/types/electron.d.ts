export { }; // Ensure this file is treated as a module

declare global {
  export interface ScreenSource {
    id: string;
    name: string;
    thumbnail: string;
  }
  export interface IElectronAPI {
    getScreenSources: () => Promise<ScreenSource[]>;
  }
  interface Window {
    electronAPI: IElectronAPI;
  }
}
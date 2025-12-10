import { Button } from '@/renderer/components/ui/Button';
import { Spinner } from '@heroui/react';
import { useEffect, useState } from 'react';

export interface ScreenSelectorProps {
  onScreenSelected: (source: MediaStream) => void;
  onCancel: () => void;
  isOpen: boolean;
}

export const ScreenSelector = ({ onScreenSelected, onCancel, isOpen }: ScreenSelectorProps) => {
  const [sources, setSources] = useState<ScreenSource[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchSources = async () => {
      setIsLoading(true);
      try {
        if (window.electronAPI) {
          const screenSources = await window.electronAPI.getScreenSources();
          setSources(screenSources);
        }
        else {
          console.error('electronAPI is not available on the window object');
        }
      } catch (error) {
        console.error('Error fetching screen sources:', error);
      } finally {
        setIsLoading(false);
      }
    };
    if (isOpen) {
      fetchSources();
    }
  }, [isOpen]);

  const handleSelect = async (source: ScreenSource) => {
    try {
      const constraints: any = {
        audio: false, // Implement later, check with macOS?
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: source.id,
          }
        }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      onScreenSelected(stream);
    } catch (err) {
      console.error('Error selecting screen source:', err);
      onScreenSelected(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[80vh] flex flex-col">
        <h2 className="text-2xl font-bold text-black mb-4">Select Screen</h2>
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Spinner className="text-blue-500" size="lg" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pr-2">
            {sources.map((source) => (
              <div
                key={source.id}
                className="group cursor-pointer rounded-lg border-2 border-transparent hover:border-blue-500 bg-gray-100 flex flex-col"
                onClick={() => handleSelect(source)}
              >
                <div className="w-full aspect-video bg-black rounded-t-md overflow-hidden">
                  <img src={source.thumbnail} alt={source.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-2">
                  <p className="text-black text-sm truncate group-hover:text-blue-500">{source.name}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-6 flex justify-end">
          <Button color="red" onPress={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
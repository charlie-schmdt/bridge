import React from 'react';
import { Chat as StreamChatComponent, Channel, MessageList, MessageInput, Window } from 'stream-chat-react';
import { StreamChat, Channel as StreamChannel } from 'stream-chat';
import 'stream-chat-react/dist/css/index.css';

interface ChatProps {
    isOpen: boolean;
    onClose: () => void;
    client: StreamChat | null;
    channel: StreamChannel | null;
}



export default function Chat({ isOpen, onClose, client, channel }: ChatProps) {
    //const { user } =  useAuth();

    /*
    const [chatClient, setChatClient] = useState<StreamChat | null>(null);
    const [channel, setChannel] = useState<StreamChannel | null>(null);
    useEffect(() => {
        
        if(!user || !roomID)  {
            return;
        }
        

        const initChat = async () => {
            try {
                const client = StreamChat.getInstance(process.env.REACT_APP_STREAM_CHAT_API_KEY || '');
                
                const response = await fetch('http://localhost:3000/api/chat/token', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('bridge_token')}`
                    }
                });
                const { token } = await response.json();
                
                const testUserToken = client.createToken('TestRoom');
                //Now we hand token to client in login/registration response

                await client.connectUser(
                    {
                        id: 'test-user-123',
                        name: 'TestUser'
                    },
                    testUserToken
                );


                const channel = client.channel('messaging', roomID, {
                    members: ['test-user-123']
                });
                await channel.watch();

                setChatClient(client);
                setChannel(channel);

            } catch (error) {
                console.error('Error initializing chat:', error);
            }
        };

        initChat();

        return () => {
            if (chatClient) {
                chatClient.disconnectUser();
                setChatClient(null);
            }
        };
    }, );

    if (!isOpen ){//|| !chatClient || !channel ) {
                return;
    }
    */



  return (
    <>
    {isOpen && (
     
      <div className="fixed inset-y-0 right-0 w-80 bg-white shadow-lg z-50 flex flex-col">       
            <div className="flex items-center justify-between p-4 border-b">
                <h1 className="text-lg font-semibold">Chat</h1>

                <button
                    type="button"
                    onClick={onClose}
                    className="text-gray500 hover:text-gray-700 p-2"
                    //style={{ pointerEvents: 'auto' }}
                >
                    x
                </button>
            </div>

                
        <body>
         <div className="flex-1 overflow-hidden">
        
            {client && <StreamChatComponent client={client} theme="messaging light">
                
                    {channel && <Channel channel={channel}>
                       
                        <Window>
                            
                            
                            <div className="flex flex-col h-full">
                                    <MessageList />
                                <div className="flex-1">

                                    <MessageInput />
                                </div>
                            </div>
                            
                            
                        </Window>
                         
                        
                    </Channel>
                    }
            </StreamChatComponent>
            }
         </div>
         </body>
        
         
        
      </div>
        )}
        </>
  );
}

/*

            {/*}
        <form className = "flex flex-col flex-1 relative">

            
            <div className="flex justify-center items-center py-4">
                <h1 className="text-lg font-semibold">Chat</h1>
            </div>            
            <div className="flex-1 px-4 py-2 overflow-y-auto flex flex-col justify-center space-y-2">
                Message List ....
            </div>
            <div className="px-3 py-2 border-t flex gap-2">
                <input type="text" 
                className="flex-1 p-2 border border rounded-lg focus:border-blue-500 outline-none" 
                placeholder="Type your message here" />
                <button 
                type="button"
                className="bg-blue-600 hover:bg-blue-800 text-white font-bold py-1.5 px-3 rounded-lg transition duration-300 ease-in-out text-sm cursor-pointer"
                >
                    Send
                </button>
            </div>
        </form>

        /*<ChannelHeader 
        /*<Thread />*/
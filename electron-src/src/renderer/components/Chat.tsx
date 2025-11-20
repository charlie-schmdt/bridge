import { useAuth } from '@/renderer/contexts/AuthContext';
import { supabase } from '@/renderer/lib/supabase';
import { useEffect, useRef, useState } from 'react';

interface Message {
  id: string;
  room_id: string;
  user_id: string;
  user_name: string;
  user_picture?: string;
  message: string;
  created_at: string;
}

<<<<<<< HEAD
interface ChatProps {
  onClose: () => void;
  roomId: string | undefined;
}

export default function Chat({ onClose, roomId }: ChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const effectiveRoomId = roomId || "00000000-0000-0000-0000-000000000000";

  const isValidUUID = (uuid: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

// This is the supabase realtime subscription for the messaging fetching
  useEffect(() => {
    const fetchMessages = async () => {
      if (!effectiveRoomId || !isValidUUID(effectiveRoomId)) {
        console.error('Invalid room ID format:', effectiveRoomId);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('room_id', effectiveRoomId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setMessages(data || []);
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };
=======
export interface ChatProps {
    closeChat: () => void;
    toggleChat: () => void;
    client: StreamChat | null;
    channel: StreamChannel | null;
}

export default function Chat({ closeChat, toggleChat, client, channel }: ChatProps) {
    //const { user } =  useAuth();
>>>>>>> 327557cce2b278dd0cd08b09b68d7da00950a6e1

    fetchMessages();
  }, [effectiveRoomId]);

  useEffect(() => {
    if (!effectiveRoomId || !isValidUUID(effectiveRoomId)) {
      console.error('Invalid room ID for subscription:', effectiveRoomId);
      return;
    }

    // Web socket
    const channel = supabase
      .channel(`room:${effectiveRoomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${effectiveRoomId}`,
        },
        (payload) => {
          console.log('New message received:', payload);
          setMessages((current) => [...current, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [effectiveRoomId]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !user) return;

    if (!isValidUUID(effectiveRoomId)) {
      console.error('Cannot send message: Invalid room ID format:', effectiveRoomId);
      alert(`Invalid room ID. Expected UUID format, got: "${effectiveRoomId}"`);
      return;
    }

    try {
      console.log('Sending message with room_id:', effectiveRoomId);
      
      // Generate UUID on client side
      const messageId = crypto.randomUUID();
      
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          id: messageId,
          room_id: effectiveRoomId,
          user_id: user.id,
          user_name: user.name,
          user_picture: user.picture,
          message: newMessage.trim(),
        });

      if (error) throw error;
      
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

<<<<<<< HEAD
    // Reset time to compare dates only
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

    if (dateOnly.getTime() === todayOnly.getTime()) {
      return 'Today';
    } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined 
      });
    }
  };
=======
  return (
      <div className="w-80 bg-white shadow-lg z-50 flex flex-col h-full">       
        <div className="flex items-center justify-between p-4 border-b">
            <h1 className="text-lg font-semibold">Chat</h1>

            <button
                type="button"
                onClick={toggleChat}
                className="text-gray500 hover:text-gray-700 p-2"
                //style={{ pointerEvents: 'auto' }}
            >
                x
            </button>
        </div>

                
        <body>
         <div className="flex-1 overflow-hidden h-full">
        
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
  );
}
>>>>>>> 327557cce2b278dd0cd08b09b68d7da00950a6e1

  const shouldShowDateSeparator = (currentMsg: Message, previousMsg: Message | null) => {
    if (!previousMsg) return true;
    
    const currentDate = new Date(currentMsg.created_at).toDateString();
    const previousDate = new Date(previousMsg.created_at).toDateString();
    
    return currentDate !== previousDate;
  };

  return (
    <div className="w-80 bg-white shadow-lg z-50 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h1 className="text-lg font-semibold">Chat</h1>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 p-2 rounded hover:bg-gray-100"
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <p className="text-gray-500">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <p className="text-gray-500">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isOwnMessage = msg.user_id === user?.id;
            const previousMsg = index > 0 ? messages[index - 1] : null;
            const showDateSeparator = shouldShowDateSeparator(msg, previousMsg);
            
            return (
              <div key={msg.id}>
                {/* Date separator */}
                {showDateSeparator && (
                  <div className="flex items-center justify-center my-4">
                    <div className="flex-grow border-t border-gray-300"></div>
                    <span className="px-4 text-xs font-semibold text-gray-500">
                      {formatDate(msg.created_at)}
                    </span>
                    <div className="flex-grow border-t border-gray-300"></div>
                  </div>
                )}

                {/* Message */}
                <div
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`flex gap-2 max-w-[75%] ${
                      isOwnMessage ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {msg.user_picture ? (
                        <img
                          src={msg.user_picture}
                          alt={msg.user_name}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold">
                          {msg.user_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Message bubble */}
                    <div className="flex flex-col">
                      <div
                        className={`px-3 py-2 rounded-lg ${
                          isOwnMessage
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        {!isOwnMessage && (
                          <p className="text-xs font-semibold mb-1 opacity-75">
                            {msg.user_name}
                          </p>
                        )}
                        <p className="text-sm break-words">{msg.message}</p>
                      </div>
                      <span
                        className={`text-xs text-gray-500 mt-1 ${
                          isOwnMessage ? 'text-right' : 'text-left'
                        }`}
                      >
                        {formatTime(msg.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-3 border-t flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
          placeholder="Type your message..."
          disabled={!user}
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || !user}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition duration-200"
        >
          Send
        </button>
      </form>
    </div>
  );
}
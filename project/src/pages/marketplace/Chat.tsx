import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Send, Loader2, ArrowLeft } from 'lucide-react';
import FloatingNav from '../../components/ui/FloatingNav';
import Button from '../../components/ui/Button';

interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

interface ChatUser {
  id: string;
  name: string;
  email: string;
  last_message?: string;
  last_message_time?: string;
  unread_count?: number;
}

const Chat: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [chats, setChats] = useState<ChatUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get receiverId from location state if coming from property details
  const receiverId = location.state?.receiverId;
  const propertyId = location.state?.propertyId;
  const propertyName = location.state?.propertyName;

  useEffect(() => {
    loadChats();
    if (receiverId) {
      loadUserDetails(receiverId);
    }
  }, [receiverId]);

  const loadUserDetails = async (userId: string) => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('id', userId)
        .maybeSingle();

      if (userError) throw userError;

      if (!userData) {
        setError('User not found');
        return;
      }
      
      setSelectedUser({
        id: userData.id,
        name: userData.full_name || userData.email || '',
        email: userData.email || ''
      });
      loadMessages(userData.id);
    } catch (err) {
      console.error('Error loading user details:', err);
      setError('Failed to load user details');
    }
  };

  const loadChats = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/marketplace/auth');
        return;
      }

      const { data: chatMessages, error: messagesError } = await supabase
        .from('chat_messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;

      // Get unique user IDs from messages
      const userIds = new Set([
        ...chatMessages.map(msg => msg.sender_id),
        ...chatMessages.map(msg => msg.receiver_id)
      ].filter(id => id !== user.id));

      if (userIds.size === 0) {
        setChats([]);
        setIsLoading(false);
        return;
      }

      // Get user details from profiles table
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', Array.from(userIds));

      if (profilesError) throw profilesError;

      if (!profiles || profiles.length === 0) {
        setChats([]);
        setIsLoading(false);
        return;
      }

      // Process chat list
      const chatList = profiles.map(profile => {
        const userMessages = chatMessages.filter(msg => 
          msg.sender_id === profile.id || msg.receiver_id === profile.id
        );
        const lastMessage = userMessages[0];
        const unreadCount = userMessages.filter(msg => 
          msg.receiver_id === user.id && !msg.read
        ).length;

        return {
          id: profile.id,
          name: profile.full_name || profile.email || '',
          email: profile.email || '',
          last_message: lastMessage?.content,
          last_message_time: lastMessage?.created_at,
          unread_count: unreadCount
        };
      });

      setChats(chatList);
    } catch (err) {
      console.error('Error loading chats:', err);
      setError('Failed to load chats');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (userId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark messages as read
      await supabase
        .from('chat_messages')
        .update({ read: true })
        .eq('sender_id', userId)
        .eq('receiver_id', user.id)
        .eq('read', false);
    } catch (err) {
      console.error('Error loading messages:', err);
      setError('Failed to load messages');
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let messageContent = newMessage.trim();
      
      // If this is the first message and we have property details, include them
      if (propertyId && propertyName && messages.length === 0) {
        messageContent = `Hi, I'm interested in your property "${propertyName}". ${messageContent}`;
      }

      const { error } = await supabase
        .from('chat_messages')
        .insert([{
          sender_id: user.id,
          receiver_id: selectedUser.id,
          content: messageContent,
          read: false
        }]);

      if (error) throw error;

      setNewMessage('');
      await loadMessages(selectedUser.id);
      await loadChats(); // Refresh chat list to update last message
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-2xl font-bold text-gray-900">Chat</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3">
            {/* Chat List */}
            <div className="border-r border-gray-200">
              {chats.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {chats.map((chat) => (
                    <button
                      key={chat.id}
                      className={`w-full px-4 py-3 text-left hover:bg-gray-50 ${
                        selectedUser?.id === chat.id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => {
                        setSelectedUser(chat);
                        loadMessages(chat.id);
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">{chat.name}</h3>
                          {chat.last_message && (
                            <p className="text-sm text-gray-500 line-clamp-1">
                              {chat.last_message}
                            </p>
                          )}
                        </div>
                        {chat.unread_count > 0 && (
                          <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                            {chat.unread_count}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  Belum ada percakapan
                </div>
              )}
            </div>

            {/* Chat Messages */}
            <div className="col-span-2">
              {selectedUser ? (
                <div className="h-[calc(100vh-16rem)] flex flex-col">
                  <div className="border-b border-gray-200 p-4">
                    <h2 className="font-medium text-gray-900">{selectedUser.name}</h2>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.sender_id === selectedUser.id ? 'justify-start' : 'justify-end'
                        }`}
                      >
                        <div
                          className={`max-w-xs px-4 py-2 rounded-lg ${
                            message.sender_id === selectedUser.id
                              ? 'bg-gray-100'
                              : 'bg-blue-500 text-white'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className="text-xs mt-1 opacity-75">
                            {new Date(message.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-200 p-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Ketik pesan..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        className="p-2 text-white bg-blue-500 rounded-full hover:bg-blue-600 disabled:opacity-50"
                      >
                        <Send size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-[calc(100vh-16rem)] flex items-center justify-center text-gray-500">
                  Pilih percakapan untuk mulai chat
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <FloatingNav />
    </div>
  );
};

export default Chat;

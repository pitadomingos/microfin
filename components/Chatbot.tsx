
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getLoans } from '../services/googleSheetService';
import { getChatbotResponseStream } from '../services/geminiService';
import { ChatMessage, Loan } from '../types';
import { GenerateContentResponse } from '@google/genai';

const Chatbot: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [loans, setLoans] = useState<Loan[]>([]);

  useEffect(() => {
    if (isOpen && user) {
        setMessages([{
            sender: 'bot',
            text: `Hi ${user.name}! I'm MicroBot. How can I help you today?`
        }]);
        getLoans().then(setLoans);
    }
  }, [isOpen, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading || !user) return;

    const userMessage: ChatMessage = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage, { sender: 'bot', text: '', isLoading: true }]);
    setInput('');
    setIsLoading(true);

    try {
        const stream = await getChatbotResponseStream(input, user, loans);
        let botResponseText = '';
        
        for await (const chunk of stream) {
            const chunkText = chunk.text;
            botResponseText += chunkText;
            setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage && lastMessage.sender === 'bot') {
                    lastMessage.text = botResponseText;
                }
                return newMessages;
            });
        }
        
        setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage && lastMessage.sender === 'bot') {
                lastMessage.isLoading = false;
            }
            return newMessages;
        });

    } catch (error) {
        console.error('Chatbot error:', error);
        const errorMessage: ChatMessage = {
            sender: 'bot',
            text: 'Sorry, I encountered an error. Please try again later.'
        };
        setMessages(prev => [...prev.slice(0, -1), errorMessage]);
    } finally {
        setIsLoading(false);
    }
  }, [input, isLoading, user, loans]);

  if (!user) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-primary text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center text-2xl z-50 hover:bg-secondary transition-colors"
      >
        <i className={`fas ${isOpen ? 'fa-times' : 'fa-robot'}`}></i>
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-full max-w-sm h-[60vh] bg-white dark:bg-dark-card rounded-lg shadow-2xl flex flex-col z-50 transition-all duration-300 ease-out origin-bottom-right transform scale-100">
          <header className="bg-primary text-white p-4 rounded-t-lg flex justify-between items-center">
            <h3 className="font-bold text-lg">MicroBot Assistant</h3>
          </header>

          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                {msg.sender === 'bot' && (
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-robot"></i>
                  </div>
                )}
                <div className={`max-w-[80%] p-3 rounded-lg ${msg.sender === 'user' ? 'bg-blue-100 dark:bg-blue-900/50 text-gray-800 dark:text-gray-200' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
                  {msg.isLoading ? <div className="animate-pulse flex space-x-1"><div className="w-2 h-2 bg-gray-400 rounded-full"></div><div className="w-2 h-2 bg-gray-400 rounded-full"></div><div className="w-2 h-2 bg-gray-400 rounded-full"></div></div> : msg.text}
                </div>
                {msg.sender === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-user"></i>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-gray-200 dark:border-dark-border">
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask me anything..."
                className="flex-1 bg-transparent p-3 focus:outline-none text-gray-800 dark:text-gray-200"
                disabled={isLoading}
              />
              <button onClick={handleSend} disabled={isLoading} className="p-3 text-primary disabled:text-gray-400">
                <i className="fas fa-paper-plane"></i>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;

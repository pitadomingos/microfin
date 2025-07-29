
import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Icon } from './Icon.js';
import * as chatService from '../services/chatService.js';

export const Chatbot = ({ documents }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const messagesEndRef = useRef(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
      setIsMounted(true);
      return () => setIsMounted(false);
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isThinking) return;

        const userMessage = { role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsThinking(true);
        
        const modelMessage = { role: 'model', text: '' };
        setMessages(prev => [...prev, modelMessage]);

        try {
            const stream = await chatService.sendMessageStream(input, documents);
            const reader = stream.getReader();
            const decoder = new TextDecoder();
            let accumulatedText = '';
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                buffer += decoder.decode(value, { stream: true });
                // SSE messages are separated by double newlines
                let boundary = buffer.indexOf('\n\n');

                while (boundary !== -1) {
                    const messageChunk = buffer.substring(0, boundary);
                    buffer = buffer.substring(boundary + 2);

                    if (messageChunk.startsWith('data:')) {
                        const dataStr = messageChunk.substring(5).trim();
                        try {
                            const data = JSON.parse(dataStr);
                            if (data.error) {
                                throw new Error(data.error.message || 'An error occurred in the AI service.');
                            }
                            if (data.text) {
                                accumulatedText += data.text;
                                setMessages(prev => {
                                    const newMessages = [...prev];
                                    const lastMessage = newMessages[newMessages.length - 1];
                                    if(lastMessage) {
                                        newMessages[newMessages.length - 1] = { ...lastMessage, text: accumulatedText };
                                    }
                                    return newMessages;
                                });
                            }
                        } catch(e) {
                            console.error("Failed to parse stream chunk:", dataStr, e);
                            throw new Error("Received a malformed response from the server.");
                        }
                    }
                    boundary = buffer.indexOf('\n\n');
                }
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Sorry, I couldn't connect to the AI service.";
            setMessages(prev => {
                 const newMessages = [...prev];
                 const lastMessage = newMessages[newMessages.length - 1];
                 if (lastMessage) {
                    newMessages[newMessages.length - 1] = { ...lastMessage, text: `Error: ${errorMessage}` };
                 }
                 return newMessages;
            });
        } finally {
            setIsThinking(false);
        }
    };
    
    if(!isMounted) return null;

    const chatbotWindow = (
        React.createElement('div', { className: `fixed bottom-24 right-6 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl flex flex-col transition-transform duration-300 origin-bottom-right ${isOpen ? 'scale-100' : 'scale-0'}` },
            React.createElement('header', { className: "p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center" },
                React.createElement('div', { className: "flex items-center gap-3" },
                    React.createElement(Icon, { name: "robot", className: "text-primary-500 text-xl" }),
                    React.createElement('h3', { className: "font-semibold text-gray-800 dark:text-white" }, "JacBot")
                ),
                React.createElement('button', { onClick: () => setIsOpen(false), className: "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" },
                    React.createElement(Icon, { name: "times", className: "" })
                )
            ),
            React.createElement('main', { className: "flex-1 p-4 overflow-y-auto h-96" },
                React.createElement('div', { className: "space-y-4" },
                     React.createElement('div', { className: "flex justify-start" },
                        React.createElement('div', { className: "bg-gray-200 dark:bg-gray-700 p-3 rounded-lg max-w-xs" },
                            React.createElement('p', { className: "text-sm text-gray-800 dark:text-gray-200" }, "Hello! How can I help you today? You can ask me about your documents, like \"how many invoices are due?\".")
                        )
                    ),
                    messages.map((msg, index) => (
                        React.createElement('div', { key: index, className: `flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}` },
                            React.createElement('div', { className: `${msg.role === 'user' ? 'bg-primary-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'} p-3 rounded-lg max-w-xs` },
                                React.createElement('p', { className: "text-sm whitespace-pre-wrap" }, msg.text, msg.role === 'model' && isThinking && index === messages.length - 1 ? React.createElement('span', {className: 'inline-block w-1 h-3 bg-gray-500 animate-pulse ml-1'}) : '')
                            )
                        )
                    )),
                    React.createElement('div', { ref: messagesEndRef })
                )
            ),
            React.createElement('footer', { className: "p-4 border-t border-gray-200 dark:border-gray-700" },
                React.createElement('div', { className: "flex items-center gap-2" },
                    React.createElement('input', {
                        type: "text",
                        value: input,
                        onChange: (e) => setInput(e.target.value),
                        onKeyPress: (e) => e.key === 'Enter' && handleSend(),
                        placeholder: "Ask something...",
                        className: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent transition",
                        disabled: isThinking
                    }),
                    React.createElement('button', { onClick: handleSend, disabled: isThinking || !input.trim(), className: "p-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:bg-primary-300" },
                        React.createElement(Icon, { name: "paper-plane", className: "" })
                    )
                )
            )
        )
    );


    return ReactDOM.createPortal(
        React.createElement(React.Fragment, null,
            chatbotWindow,
            React.createElement('button', {
                onClick: () => setIsOpen(!isOpen),
                className: "fixed bottom-6 right-6 w-14 h-14 bg-primary-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary-600 transition-transform duration-200 hover:scale-110 z-50",
                'aria-label': "Toggle Chatbot"
            },
                React.createElement(Icon, { name: isOpen ? 'times' : 'comment-dots', className: "text-2xl" })
            )
        ),
        document.getElementById('modal-root')
    );
};

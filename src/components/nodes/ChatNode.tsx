import { useState } from 'react';
import { MessageSquare, Send, Bot, User } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export function ChatNode({ id, data }: any) {
  const [messages, setMessages] = useState<{role: string, text: string}[]>([
    { role: 'model', text: 'Hi! I can help you brainstorm and refine prompts for your campaign scenes. What are we building?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const newMessages = [...messages, { role: 'user', text: input }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: "You are an expert creative director and prompt engineer. Help the user brainstorm and refine highly detailed image generation prompts for a marketing campaign. Keep responses concise and focus on providing ready-to-use prompts.",
        },
      });

      const historyText = newMessages.map(m => `${m.role}: ${m.text}`).join('\n');
      const response = await chat.sendMessage({ message: `Here is the conversation history:\n${historyText}\n\nPlease respond to the last user message.` });
      
      setMessages([...newMessages, { role: 'model', text: response.text || '' }]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm w-80 flex flex-col overflow-hidden h-96">
      <div className="p-3 border-b border-zinc-100 bg-zinc-50 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-blue-500" />
        <span className="text-sm font-medium text-zinc-700">Prompt Assistant</span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-3 nodrag">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-zinc-200'}`}>
              {msg.role === 'user' ? <User className="w-3 h-3 text-white" /> : <Bot className="w-3 h-3 text-zinc-600" />}
            </div>
            <div className={`text-xs p-2 rounded-lg max-w-[80%] ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-zinc-100 text-zinc-700'}`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-full bg-zinc-200 flex items-center justify-center shrink-0">
              <Bot className="w-3 h-3 text-zinc-600" />
            </div>
            <div className="text-xs p-2 rounded-lg bg-zinc-100 text-zinc-500 flex items-center gap-1">
              <span className="animate-bounce">.</span><span className="animate-bounce delay-75">.</span><span className="animate-bounce delay-150">.</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-2 border-t border-zinc-100 bg-zinc-50 flex gap-2 nodrag">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask for prompt ideas..."
          className="flex-1 bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:border-indigo-500"
        />
        <button onClick={handleSend} disabled={isLoading || !input.trim()} className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white p-1.5 rounded-lg transition-colors">
          <Send className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

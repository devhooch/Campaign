import { useState } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Sparkles, Loader2, Image as ImageIcon } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export function AssetGeneratorNode({ id, data }: any) {
  const { updateNodeData } = useReactFlow();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: data.prompt || 'A professional fashion model',
        config: {
          imageConfig: { aspectRatio: "3:4", imageSize: "1K" }
        }
      });
      
      let imageUrl = '';
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }
      
      if (imageUrl) {
        updateNodeData(id, { imageBase64: imageUrl, mimeType: 'image/png' });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm w-[400px] flex overflow-hidden">
      <div className="w-1/2 p-3 border-r border-zinc-200 flex flex-col gap-3 bg-zinc-50">
        <div className="flex items-center gap-2 text-zinc-700 mb-1">
          <ImageIcon className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-semibold">{data.title || 'Asset Generator'}</span>
        </div>
        <textarea
          className="w-full flex-1 text-xs p-2 border border-zinc-200 bg-white text-zinc-900 rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500 nodrag"
          placeholder="Prompt..."
          value={data.prompt || ''}
          onChange={(e) => updateNodeData(id, { prompt: e.target.value })}
        />
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !data.prompt}
          className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-2 disabled:opacity-50 nodrag transition-colors"
        >
          {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          Generate
        </button>
      </div>
      <div className="w-1/2 bg-white p-2 flex items-center justify-center relative">
        {data.imageBase64 ? (
          <img src={data.imageBase64} alt="Generated" className="w-full h-full object-cover rounded-lg border border-zinc-200" />
        ) : (
          <div className="text-zinc-400 text-xs text-center px-4">Generated image will appear here</div>
        )}
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-indigo-600 border-2 border-white" />
    </div>
  );
}

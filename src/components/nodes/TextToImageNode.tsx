import { useState } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Sparkles, Loader2, Image as ImageIcon, Download } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const ASPECT_RATIOS = [
  { label: '1:1', value: '1:1' },
  { label: '3:4', value: '3:4' },
  { label: '4:3', value: '4:3' },
  { label: '16:9', value: '16:9' },
  { label: '9:16', value: '9:16' },
];

export function TextToImageNode({ id, data }: any) {
  const { updateNodeData } = useReactFlow();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const aspectRatio = data.aspectRatio || '1:1';

  const handleGenerate = async () => {
    if (!data.prompt) return;
    setIsGenerating(true);
    setError('');
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: data.prompt,
        config: {
          imageConfig: { aspectRatio, imageSize: '1K' },
        },
      });

      let imageUrl = '';
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }

      if (imageUrl) {
        updateNodeData(id, { imageBase64: imageUrl });
      } else {
        setError('No image returned. Try a different prompt.');
      }
    } catch (err: any) {
      setError(err?.message || 'Generation failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!data.imageBase64) return;
    const a = document.createElement('a');
    a.href = data.imageBase64;
    a.download = 'generated-image.png';
    a.click();
  };

  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm w-[340px] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-zinc-100 bg-zinc-50">
        <ImageIcon className="w-4 h-4 text-violet-600" />
        <span className="text-xs font-semibold text-zinc-700">Text to Image</span>
      </div>

      <div className="p-3 flex flex-col gap-3">
        {/* Prompt */}
        <textarea
          className="w-full text-xs p-2 border border-zinc-200 bg-zinc-50 text-zinc-900 rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-violet-500 nodrag"
          placeholder="Describe the image you want to generate..."
          rows={4}
          value={data.prompt || ''}
          onChange={(e) => updateNodeData(id, { prompt: e.target.value })}
        />

        {/* Aspect ratio */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {ASPECT_RATIOS.map((r) => (
            <button
              key={r.value}
              onClick={() => updateNodeData(id, { aspectRatio: r.value })}
              className={`px-2 py-1 rounded text-[11px] font-medium border nodrag transition-colors ${
                aspectRatio === r.value
                  ? 'bg-violet-600 text-white border-violet-600'
                  : 'bg-white text-zinc-500 border-zinc-200 hover:border-violet-300'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !data.prompt}
          className="w-full py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-2 disabled:opacity-50 nodrag transition-colors"
        >
          {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          {isGenerating ? 'Generating...' : 'Generate'}
        </button>

        {/* Error */}
        {error && (
          <p className="text-[11px] text-red-500">{error}</p>
        )}

        {/* Image output */}
        {data.imageBase64 ? (
          <div className="relative group rounded-lg overflow-hidden border border-zinc-200">
            <img
              src={data.imageBase64}
              alt="Generated"
              className="w-full object-cover rounded-lg"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                onClick={handleDownload}
                className="p-2 bg-white rounded-lg shadow nodrag hover:bg-zinc-100 transition-colors"
              >
                <Download className="w-4 h-4 text-zinc-700" />
              </button>
            </div>
          </div>
        ) : (
          <div className="h-32 rounded-lg border border-dashed border-zinc-200 flex items-center justify-center">
            <p className="text-xs text-zinc-400">Generated image will appear here</p>
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-violet-600 border-2 border-white" />
    </div>
  );
}

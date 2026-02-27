import { Handle, Position, useReactFlow } from '@xyflow/react';
import { LayoutGrid, Download, Video, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { GoogleGenAI } from '@google/genai';

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export function CampaignOutputNode({ id, data }: any) {
  const { updateNodeData } = useReactFlow();
  const items = data.items || [];
  const [generatingVideoFor, setGeneratingVideoFor] = useState<number | null>(null);

  const downloadMedia = (url: string, index: number, ext: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `campaign-shot-${index + 1}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleGenerateVideo = async (item: any, index: number) => {
    try {
      setGeneratingVideoFor(index);
      if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) await window.aistudio.openSelectKey();
      }
      const currentApiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || '';
      const localAi = new GoogleGenAI({ apiKey: currentApiKey });

      const base64Data = item.imageUrl.split(',')[1];

      let operation = await localAi.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: `Animate this scene. ${item.prompt}`,
        image: {
          imageBytes: base64Data,
          mimeType: 'image/png',
        },
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await localAi.operations.getVideosOperation({operation: operation});
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!downloadLink) throw new Error('No video generated.');

      const response = await fetch(downloadLink, {
        method: 'GET',
        headers: { 'x-goog-api-key': currentApiKey },
      });
      const blob = await response.blob();
      const videoUrl = URL.createObjectURL(blob);

      const newItems = [...items];
      newItems[index] = { ...newItems[index], videoUrl };
      updateNodeData(id, { items: newItems });

    } catch (err) {
      console.error("Video generation failed", err);
      alert("Video generation failed: " + (err as Error).message);
    } finally {
      setGeneratingVideoFor(null);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm w-[1000px] max-w-[90vw] flex flex-col overflow-hidden">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-indigo-500 border-2 border-white" />
      <div className="p-3 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-4 h-4 text-indigo-500" />
          <span className="text-sm font-medium text-zinc-700">Campaign Board</span>
          {data.status && <span className="text-xs text-zinc-500 ml-2">({data.status})</span>}
        </div>
      </div>
      <div className="p-4 bg-zinc-50/50 min-h-[400px]">
        {items.length > 0 ? (
          <div className="flex flex-row gap-4 overflow-x-auto nodrag pb-4 snap-x">
            {items.map((item: any, i: number) => (
              <div key={i} className="group relative w-64 shrink-0 aspect-[3/4] rounded-lg overflow-visible bg-white border border-zinc-200 shadow-sm snap-center">
                <Handle type="source" position={Position.Bottom} id={`item-${i}`} className="w-4 h-4 bg-emerald-500 border-2 border-white z-50" style={{ bottom: '-8px', left: '50%' }} />
                <div className="absolute inset-0 overflow-hidden rounded-lg">
                  <div className="absolute top-2 left-2 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded-full z-10 shadow-sm backdrop-blur-sm">
                    {i + 1}
                  </div>
                  {item.videoUrl ? (
                    <video src={item.videoUrl} autoPlay loop muted className="w-full h-full object-cover" />
                  ) : (
                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                    <p className="text-white text-xs font-medium line-clamp-3">{item.title}</p>
                    <div className="flex justify-end gap-2">
                      {!item.videoUrl && (
                        <button
                          onClick={() => handleGenerateVideo(item, i)}
                          disabled={generatingVideoFor !== null}
                          className="bg-white/20 hover:bg-white/40 disabled:opacity-50 text-white p-1.5 rounded transition-colors"
                          title="Animate to Video"
                        >
                          {generatingVideoFor === i ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
                        </button>
                      )}
                      <button
                        onClick={() => downloadMedia(item.videoUrl || item.imageUrl, i, item.videoUrl ? 'mp4' : 'png')}
                        className="bg-white/20 hover:bg-white/40 text-white p-1.5 rounded transition-colors"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {generatingVideoFor === i && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="flex flex-col items-center gap-2 text-white">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span className="text-xs font-medium">Animating...</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {/* Placeholders for remaining items if generating */}
            {Array.from({ length: Math.max(0, 9 - items.length) }).map((_, i) => (
              <div key={`placeholder-${i}`} className="relative w-64 shrink-0 aspect-[3/4] rounded-lg border-2 border-dashed border-zinc-200 bg-zinc-50/50 animate-pulse snap-center flex items-center justify-center">
                <div className="absolute top-2 left-2 bg-zinc-200 text-zinc-500 text-xs font-bold px-2 py-1 rounded-full z-10">
                  {items.length + i + 1}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-zinc-500 italic text-sm">
            {data.status || 'Connect a generator and create a campaign to see the 9-grid output...'}
          </div>
        )}
      </div>
    </div>
  );
}

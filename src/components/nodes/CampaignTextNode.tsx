import { Handle, Position, useReactFlow } from '@xyflow/react';
import { MonitorPlay, Upload, X } from 'lucide-react';
import { useRef } from 'react';

export function CampaignTextNode({ id, data }: any) {
  const { updateNodeData } = useReactFlow();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateNodeData(id, {
          mediaBase64: reader.result as string,
          mimeType: file.type
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const isVideo = data.mimeType?.startsWith('video/');

  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm w-64 overflow-hidden">
      <div className="p-3 border-b border-zinc-100 bg-zinc-50 flex items-center gap-2">
        <MonitorPlay className="w-4 h-4 text-rose-500" />
        <span className="text-sm font-medium text-zinc-700">Screen Content / Action</span>
      </div>
      <div className="p-3 flex flex-col gap-3">
        {data.mediaBase64 ? (
          <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-zinc-100 border border-zinc-200">
            {isVideo ? (
              <video src={data.mediaBase64} className="w-full h-full object-cover" controls muted />
            ) : (
              <img src={data.mediaBase64} alt="Screen Content" className="w-full h-full object-cover" />
            )}
            <button
              onClick={() => updateNodeData(id, { mediaBase64: null, mimeType: null })}
              className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded hover:bg-black/70 transition-colors nodrag z-10"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div
            className="w-full aspect-video rounded-lg border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center gap-2 bg-zinc-50 hover:bg-zinc-100 transition-colors cursor-pointer nodrag"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-5 h-5 text-zinc-400" />
            <span className="text-xs font-medium text-zinc-500 text-center px-4">Upload Image or Video</span>
          </div>
        )}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*,video/*"
          onChange={handleFileChange}
        />
        <textarea
          className="w-full text-xs p-2 border border-zinc-200 bg-white text-zinc-900 rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-rose-500 nodrag"
          rows={3}
          value={data.content || ''}
          onChange={(e) => updateNodeData(id, { content: e.target.value })}
          placeholder="Describe what should be shown..."
        />
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-rose-500 border-2 border-white" />
    </div>
  );
}

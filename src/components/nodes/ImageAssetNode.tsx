import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Image as ImageIcon, Upload } from 'lucide-react';
import { useRef } from 'react';

export function ImageAssetNode({ id, data }: any) {
  const { updateNodeData } = useReactFlow();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateNodeData(id, { 
          imageBase64: reader.result as string,
          mimeType: file.type
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm w-64 overflow-hidden">
      <div className="p-3 border-b border-zinc-100 bg-zinc-50 flex items-center gap-2">
        <ImageIcon className="w-4 h-4 text-blue-500" />
        <input 
          className="text-sm font-medium text-zinc-700 bg-transparent border-none focus:outline-none w-full nodrag"
          value={data.label || 'Image Asset'}
          onChange={(e) => updateNodeData(id, { label: e.target.value })}
        />
      </div>
      <div className="p-3 flex flex-col items-center justify-center gap-3">
        {data.imageBase64 ? (
          <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-zinc-100 border border-zinc-200">
            <img src={data.imageBase64} alt="Asset" className="w-full h-full object-cover" />
            <button 
              onClick={() => updateNodeData(id, { imageBase64: null, mimeType: null })}
              className="absolute top-1 right-1 bg-black/50 text-white text-xs px-2 py-1 rounded hover:bg-black/70 transition-colors nodrag"
            >
              Clear
            </button>
          </div>
        ) : (
          <div 
            className="w-full aspect-video rounded-lg border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center gap-2 bg-zinc-50 hover:bg-zinc-100 transition-colors cursor-pointer nodrag"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-5 h-5 text-zinc-400" />
            <span className="text-xs font-medium text-zinc-500">Upload Image</span>
          </div>
        )}
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*"
          onChange={handleFileChange}
        />
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-blue-500 border-2 border-white" />
    </div>
  );
}

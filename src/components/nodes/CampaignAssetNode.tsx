import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Package, User, MapPin, Upload, X } from 'lucide-react';
import { useRef } from 'react';

const CONFIG = {
  product: { icon: Package, color: 'text-blue-500', bg: 'bg-blue-500', label: 'Product Mockup' },
  character: { icon: User, color: 'text-purple-500', bg: 'bg-purple-500', label: 'Hero / Character' },
  environment: { icon: MapPin, color: 'text-emerald-500', bg: 'bg-emerald-500', label: 'Environment' },
};

export function CampaignAssetNode({ id, data }: any) {
  const { updateNodeData } = useReactFlow();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const type = (data.assetType as 'product' | 'character' | 'environment') || 'product';
  const config = CONFIG[type] || CONFIG.product;
  const Icon = config.icon;

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
        <Icon className={`w-4 h-4 ${config.color}`} />
        <span className="text-sm font-medium text-zinc-700">{config.label}</span>
      </div>
      <div className="p-3 flex flex-col gap-3">
        {data.imageBase64 ? (
          <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-zinc-100 border border-zinc-200">
            <img src={data.imageBase64} alt="Asset" className="w-full h-full object-cover" />
            <button
              onClick={() => updateNodeData(id, { imageBase64: null, mimeType: null })}
              className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded hover:bg-black/70 transition-colors nodrag"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div
            className="w-full aspect-square rounded-lg border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center gap-2 bg-zinc-50 hover:bg-zinc-100 transition-colors cursor-pointer nodrag"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-5 h-5 text-zinc-400" />
            <span className="text-xs font-medium text-zinc-500 text-center px-4">Upload {config.label} Image</span>
          </div>
        )}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />
        <textarea
          className="w-full text-xs p-2 border border-zinc-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all nodrag"
          rows={2}
          value={data.description || ''}
          onChange={(e) => updateNodeData(id, { description: e.target.value })}
          placeholder={`Describe the ${type}...`}
        />
      </div>
      <Handle type="source" position={Position.Right} className={`w-3 h-3 ${config.bg} border-2 border-white`} />
    </div>
  );
}

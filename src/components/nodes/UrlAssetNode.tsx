import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Link as LinkIcon } from 'lucide-react';

export function UrlAssetNode({ id, data }: any) {
  const { updateNodeData } = useReactFlow();
  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm w-64 overflow-hidden">
      <div className="p-3 border-b border-zinc-100 bg-zinc-50 flex items-center gap-2">
        <LinkIcon className="w-4 h-4 text-emerald-500" />
        <input 
          className="text-sm font-medium text-zinc-700 bg-transparent border-none focus:outline-none w-full nodrag"
          value={data.label || 'URL Asset'}
          onChange={(e) => updateNodeData(id, { label: e.target.value })}
        />
      </div>
      <div className="p-3">
        <input 
          type="url"
          className="w-full text-sm p-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all nodrag"
          value={data.url || ''}
          onChange={(e) => updateNodeData(id, { url: e.target.value })}
          placeholder="https://example.com"
        />
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-emerald-500 border-2 border-white" />
    </div>
  );
}

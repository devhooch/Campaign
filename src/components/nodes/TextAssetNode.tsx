import { Handle, Position, useReactFlow } from '@xyflow/react';
import { FileText } from 'lucide-react';

export function TextAssetNode({ id, data }: any) {
  const { updateNodeData } = useReactFlow();
  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm w-64 overflow-hidden">
      <div className="p-3 border-b border-zinc-100 bg-zinc-50 flex items-center gap-2">
        <FileText className="w-4 h-4 text-indigo-500" />
        <input 
          className="text-sm font-medium text-zinc-700 bg-transparent border-none focus:outline-none w-full nodrag"
          value={data.label || 'Text Asset'}
          onChange={(e) => updateNodeData(id, { label: e.target.value })}
        />
      </div>
      <div className="p-3">
        <textarea 
          className="w-full text-sm p-2 border border-zinc-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all nodrag"
          rows={4}
          value={data.content || ''}
          onChange={(e) => updateNodeData(id, { content: e.target.value })}
          placeholder="Enter asset content (e.g. Brand Voice, Product Details)..."
        />
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-indigo-500 border-2 border-white" />
    </div>
  );
}

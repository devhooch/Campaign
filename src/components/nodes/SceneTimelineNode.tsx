import { Handle, Position, useReactFlow, useNodeConnections, useNodesData } from '@xyflow/react';
import { Film } from 'lucide-react';

export function SceneTimelineNode({ id, data }: any) {
  const { updateNodeData } = useReactFlow();
  const connections = useNodeConnections({ handleType: 'target' });
  const sourceNodesData = useNodesData(connections.map(c => c.source));

  let mediaUrl = data.mediaUrl;
  
  if (connections.length > 0 && sourceNodesData.length > 0) {
    const conn = connections[0];
    const sourceData = sourceNodesData[0].data as any;
    if (sourceData.items && conn.sourceHandle && conn.sourceHandle.startsWith('item-')) {
      const index = parseInt(conn.sourceHandle.split('-')[1]);
      const item = sourceData.items[index];
      if (item) {
        mediaUrl = item.videoUrl || item.imageUrl;
      }
    }
  }

  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm w-64 overflow-hidden">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-emerald-500 border-2 border-white" />
      <div className="p-2 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
        <span className="text-xs font-semibold text-zinc-700">{data.title || 'Scene'}</span>
        <Film className="w-3 h-3 text-zinc-400" />
      </div>
      <div className="p-3 flex flex-col gap-3">
        <div className="aspect-[3/4] rounded-lg border-2 border-dashed border-zinc-200 bg-zinc-50 flex items-center justify-center overflow-hidden">
          {mediaUrl ? (
            mediaUrl.endsWith('.mp4') || mediaUrl.startsWith('blob:') ? (
              <video src={mediaUrl} autoPlay loop muted className="w-full h-full object-cover" />
            ) : (
              <img src={mediaUrl} className="w-full h-full object-cover" />
            )
          ) : (
            <span className="text-zinc-400 text-xs text-center px-4">Connect a shot from the Campaign Board</span>
          )}
        </div>
        <textarea
          className="w-full text-xs p-2 border border-zinc-200 bg-white text-zinc-900 rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-emerald-500 nodrag"
          rows={3}
          placeholder="Scene description / Voiceover..."
          value={data.description || ''}
          onChange={(e) => updateNodeData(id, { description: e.target.value })}
        />
      </div>
    </div>
  );
}

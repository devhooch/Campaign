import { NodeResizer } from '@xyflow/react';

export function GroupNode({ data, selected }: any) {
  return (
    <div className="w-full h-full bg-white/50 border border-zinc-200/80 rounded-xl relative backdrop-blur-sm">
      <NodeResizer color="#6366f1" isVisible={selected} minWidth={200} minHeight={100} />
      <div className="absolute top-0 left-0 w-full p-3 border-b border-zinc-200/80 bg-white/80 rounded-t-xl flex items-center">
        <span className="text-xs font-bold text-zinc-500 tracking-widest uppercase">{data.title}</span>
      </div>
    </div>
  );
}

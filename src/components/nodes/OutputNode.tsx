import { Handle, Position } from '@xyflow/react';
import { CheckCircle, Copy, Download } from 'lucide-react';
import Markdown from 'react-markdown';
import { useState } from 'react';

export function OutputNode({ id, data }: any) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    if (!data.content) return;
    try {
      await navigator.clipboard.writeText(data.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const downloadMedia = () => {
    const url = data.imageUrl || data.videoUrl;
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `generated-${data.type}-${Date.now()}.${data.type === 'video' ? 'mp4' : 'png'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const isImage = data.type === 'image' || !!data.imageUrl;
  const isVideo = data.type === 'video' || !!data.videoUrl;
  const isMedia = isImage || isVideo;

  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm w-96 max-h-[500px] flex flex-col overflow-hidden">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-purple-500 border-2 border-white" />
      <div className="p-3 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-medium text-zinc-700">Generated Output</span>
        </div>
        {isMedia ? (
          <button 
            onClick={downloadMedia}
            className="text-zinc-400 hover:text-zinc-600 transition-colors nodrag"
            title="Download Media"
          >
            <Download className="w-4 h-4" />
          </button>
        ) : (
          <button 
            onClick={copyToClipboard}
            className="text-zinc-400 hover:text-zinc-600 transition-colors nodrag"
            title="Copy to clipboard"
          >
            <Copy className={`w-4 h-4 ${copied ? 'text-emerald-500' : ''}`} />
          </button>
        )}
      </div>
      <div className="p-4 overflow-y-auto prose prose-sm prose-zinc max-w-none nodrag cursor-text">
        {isVideo ? (
          <div className="w-full rounded-lg overflow-hidden border border-zinc-200 bg-black">
            <video src={data.videoUrl} controls autoPlay loop className="w-full h-auto" />
          </div>
        ) : isImage ? (
          <div className="w-full rounded-lg overflow-hidden border border-zinc-200">
            <img src={data.imageUrl} alt="Generated output" className="w-full h-auto" />
          </div>
        ) : data.content ? (
          <Markdown>{data.content}</Markdown>
        ) : (
          <span className="text-zinc-400 italic">Connect a generator and click generate...</span>
        )}
      </div>
    </div>
  );
}

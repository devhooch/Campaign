import { useState } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Sparkles, Loader2, AlertCircle, Image as ImageIcon, Type, Video } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export function GeneratorNode({ id, data }: any) {
  const { updateNodeData, getNodes, getEdges, setNodes } = useReactFlow();
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError('');
    try {
      const nodes = getNodes();
      const edges = getEdges();
      
      const incomingEdges = edges.filter(e => e.target === id);
      const sourceNodeIds = incomingEdges.map(e => e.source);
      const sourceNodes = nodes.filter(n => sourceNodeIds.includes(n.id));

      const outputType = data.outputType || 'text';
      
      let hasUrl = false;
      const parts: any[] = [];
      
      if (outputType === 'text') {
        let promptText = `You are an expert brand copywriter and social media manager.\n\n`;
        promptText += `CONTEXT ASSETS:\n`;
        
        if (sourceNodes.length === 0) {
          promptText += `(No context assets provided. Rely on general knowledge.)\n`;
        } else {
          sourceNodes.forEach((node, index) => {
            if (node.type === 'textAsset') {
              promptText += `- Asset ${index + 1} (${node.data.label || 'Text'}): ${node.data.content}\n`;
            } else if (node.type === 'urlAsset') {
              promptText += `- Asset ${index + 1} (${node.data.label || 'URL'}): ${node.data.url} (Read and analyze this website)\n`;
              if (node.data.url) hasUrl = true;
            } else if (node.type === 'imageAsset' && node.data.imageBase64) {
              promptText += `- Asset ${index + 1} (${node.data.label || 'Image'}): [See attached image]\n`;
              const base64Data = (node.data.imageBase64 as string).split(',')[1];
              parts.push({
                inlineData: {
                  data: base64Data,
                  mimeType: node.data.mimeType || 'image/jpeg'
                }
              });
            }
          });
        }

        promptText += `\nTASK:\nWrite a highly engaging piece of content for ${data.platform || 'LinkedIn'} about the following topic:\n"${data.topic || ''}"\n`;
        promptText += `\nREQUIREMENTS:\n1. Use the provided context assets to inform the tone, style, and factual details.\n2. Optimize for the platform.\n3. Do not include placeholder text.\n`;
        
        parts.push({ text: promptText });

        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: { parts },
          config: {
            temperature: 0.7,
            tools: hasUrl ? [{ urlContext: {} }] : undefined
          }
        });

        const generatedText = response.text;

        const outgoingEdges = edges.filter(e => e.source === id);
        const targetNodeIds = outgoingEdges.map(e => e.target);
        
        setNodes(nds => nds.map(n => {
          if (targetNodeIds.includes(n.id) && n.type === 'output') {
            return { ...n, data: { ...n.data, content: generatedText, type: 'text' } };
          }
          return n;
        }));
      } else if (outputType === 'image') {
        // Image Generation
        let promptText = `Generate an image based on the following topic/prompt: "${data.topic || ''}". `;
        
        sourceNodes.forEach((node, index) => {
          if (node.type === 'textAsset') {
            promptText += `Context ${index + 1}: ${node.data.content}. `;
          } else if (node.type === 'imageAsset' && node.data.imageBase64) {
            const base64Data = (node.data.imageBase64 as string).split(',')[1];
            parts.push({
              inlineData: {
                data: base64Data,
                mimeType: node.data.mimeType || 'image/jpeg'
              }
            });
          }
        });
        
        parts.push({ text: promptText });

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts },
          config: {
            imageConfig: {
              aspectRatio: "1:1",
              imageSize: "1K"
            }
          }
        });
        
        let imageUrl = '';
        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            const base64EncodeString = part.inlineData.data;
            imageUrl = `data:image/png;base64,${base64EncodeString}`;
            break;
          }
        }

        if (!imageUrl) {
          throw new Error('No image generated.');
        }

        const outgoingEdges = edges.filter(e => e.source === id);
        const targetNodeIds = outgoingEdges.map(e => e.target);
        
        setNodes(nds => nds.map(n => {
          if (targetNodeIds.includes(n.id) && n.type === 'output') {
            return { ...n, data: { ...n.data, imageUrl: imageUrl, type: 'image' } };
          }
          return n;
        }));
      } else if (outputType === 'video') {
        setLoadingMessage('Checking API key...');
        if (window.aistudio) {
          const hasKey = await window.aistudio.hasSelectedApiKey();
          if (!hasKey) {
            await window.aistudio.openSelectKey();
          }
        }
        
        const currentApiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || '';
        const localAi = new GoogleGenAI({ apiKey: currentApiKey });

        let promptText = `Generate a video based on the following topic/prompt: "${data.topic || ''}". `;
        let startingImage: any = undefined;

        sourceNodes.forEach((node, index) => {
          if (node.type === 'textAsset') {
            promptText += `Context ${index + 1}: ${node.data.content}. `;
          } else if (node.type === 'imageAsset' && node.data.imageBase64 && !startingImage) {
            const base64Data = (node.data.imageBase64 as string).split(',')[1];
            startingImage = {
              imageBytes: base64Data,
              mimeType: node.data.mimeType || 'image/jpeg'
            };
          }
        });

        setLoadingMessage('Starting video generation...');
        let operation = await localAi.models.generateVideos({
          model: 'veo-3.1-fast-generate-preview',
          prompt: promptText,
          ...(startingImage ? { image: startingImage } : {}),
          config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: '16:9'
          }
        });

        setLoadingMessage('Generating video (this may take a few minutes)...');
        while (!operation.done) {
          await new Promise(resolve => setTimeout(resolve, 10000));
          operation = await localAi.operations.getVideosOperation({operation: operation});
        }

        setLoadingMessage('Downloading video...');
        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) throw new Error('No video generated.');

        const response = await fetch(downloadLink, {
          method: 'GET',
          headers: {
            'x-goog-api-key': currentApiKey,
          },
        });
        const blob = await response.blob();
        const videoUrl = URL.createObjectURL(blob);

        const outgoingEdges = edges.filter(e => e.source === id);
        const targetNodeIds = outgoingEdges.map(e => e.target);
        
        setNodes(nds => nds.map(n => {
          if (targetNodeIds.includes(n.id) && n.type === 'output') {
            return { ...n, data: { ...n.data, videoUrl: videoUrl, type: 'video' } };
          }
          return n;
        }));
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to generate content');
    } finally {
      setIsGenerating(false);
      setLoadingMessage('');
    }
  };

  const outputType = data.outputType || 'text';

  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm w-80 overflow-hidden">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-zinc-400 border-2 border-white" />
      <div className="p-3 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-500" />
          <span className="text-sm font-medium text-zinc-700">AI Generator</span>
        </div>
        
        <div className="flex bg-zinc-200/50 p-1 rounded-md nodrag">
          <button 
            onClick={() => updateNodeData(id, { outputType: 'text' })}
            className={`p-1 rounded ${outputType === 'text' ? 'bg-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
            title="Generate Text"
          >
            <Type className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => updateNodeData(id, { outputType: 'image' })}
            className={`p-1 rounded ${outputType === 'image' ? 'bg-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
            title="Generate Image"
          >
            <ImageIcon className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => updateNodeData(id, { outputType: 'video' })}
            className={`p-1 rounded ${outputType === 'video' ? 'bg-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
            title="Generate Video"
          >
            <Video className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="p-4 space-y-4">
        {outputType === 'text' && (
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Platform</label>
            <select 
              className="w-full text-sm p-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 nodrag"
              value={data.platform || 'LinkedIn'}
              onChange={(e) => updateNodeData(id, { platform: e.target.value })}
            >
              <option>LinkedIn</option>
              <option>Twitter</option>
              <option>Instagram</option>
              <option>Blog</option>
              <option>Email</option>
            </select>
          </div>
        )}
        
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">Prompt / Topic</label>
          <textarea 
            className="w-full text-sm p-2 border border-zinc-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 nodrag"
            rows={3}
            value={data.topic || ''}
            onChange={(e) => updateNodeData(id, { topic: e.target.value })}
            placeholder={outputType === 'text' ? "What should this post be about?" : outputType === 'image' ? "Describe the image you want to generate..." : "Describe the video you want to generate..."}
          />
        </div>
        
        {error && (
          <div className="flex items-start gap-2 text-red-600 text-xs bg-red-50 p-2 rounded-lg border border-red-100">
            <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button 
          onClick={handleGenerate}
          disabled={isGenerating || !data.topic}
          className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-colors nodrag overflow-hidden"
        >
          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <Sparkles className="w-4 h-4 shrink-0" />}
          <span className="truncate">{isGenerating ? loadingMessage || 'Generating...' : `Generate ${outputType === 'text' ? 'Text' : outputType === 'image' ? 'Image' : 'Video'}`}</span>
        </button>
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-purple-500 border-2 border-white" />
    </div>
  );
}

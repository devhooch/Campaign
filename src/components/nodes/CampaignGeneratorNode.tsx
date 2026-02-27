import { useState } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Sparkles, Loader2, AlertCircle, LayoutGrid } from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export function CampaignGeneratorNode({ id, data }: any) {
  const { updateNodeData, getNodes, getEdges, setNodes } = useReactFlow();
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError('');
    setProgress('Analyzing assets...');
    try {
      const nodes = getNodes();
      const edges = getEdges();

      const incomingEdges = edges.filter(e => e.target === id);
      const sourceNodeIds = incomingEdges.map(e => e.source);
      const sourceNodes = nodes.filter(n => sourceNodeIds.includes(n.id));

      const outgoingEdges = edges.filter(e => e.source === id);
      const targetNodeIds = outgoingEdges.map(e => e.target);

      // Clear previous output
      setNodes(nds => nds.map(n => {
        if (targetNodeIds.includes(n.id) && n.type === 'campaignOutput') {
          return { ...n, data: { ...n.data, items: [], status: 'Starting generation...' } };
        }
        return n;
      }));

      let contextText = `Campaign Theme: ${data.topic || 'A creative marketing campaign'}\n\n`;
      const imageParts: any[] = [];
      const conceptMediaParts: any[] = [];

      sourceNodes.forEach((node) => {
        if (node.type === 'campaignAsset' || node.type === 'assetGenerator') {
          const assetType = String(node.data.assetType || node.data.title || 'asset');
          contextText += `${assetType.toUpperCase()} DESCRIPTION: ${node.data.description || node.data.prompt || 'None'}\n`;
          if (node.data.imageBase64) {
            const base64Data = (node.data.imageBase64 as string).split(',')[1];
            const part = {
              inlineData: {
                data: base64Data,
                mimeType: node.data.mimeType || 'image/jpeg'
              }
            };
            imageParts.push(part);
            conceptMediaParts.push(part);
            contextText += `(See attached image for ${assetType})\n`;
          }
        } else if (node.type === 'campaignText') {
          contextText += `SCREEN CONTENT / ACTION: ${node.data.content || 'None'}\n`;
          if (node.data.mediaBase64) {
            const base64Data = (node.data.mediaBase64 as string).split(',')[1];
            const mimeType = String(node.data.mimeType || 'image/jpeg');
            const part = {
              inlineData: {
                data: base64Data,
                mimeType: mimeType
              }
            };
            conceptMediaParts.push(part);
            if (!mimeType.startsWith('video/')) {
              imageParts.push(part);
            }
            contextText += `(See attached media for Screen Content / Action)\n`;
          }
        }
      });

      setProgress('Generating 9 campaign concepts...');

      // 1. Generate 9 concepts
      const conceptPrompt = `
      You are an expert creative director. Based on the provided assets and theme, generate exactly 9 distinct, highly detailed image generation prompts for a marketing campaign.
      
      CRITICAL INSTRUCTIONS:
      1. ENVIRONMENT INTEGRATION: The "Product" and "Hero/Character" MUST be physically interacting with the "Environment". They should rest on surfaces, cast shadows, and be affected by the environment's lighting. Do NOT just use the environment as a flat backdrop.
      2. REALISM & DEPTH: Describe how the product sits within the 3D space of the scene. Mention reflections, shadows, and physical contact with objects in the environment.
      3. SCREEN CONTENT: Strictly follow the "SCREEN CONTENT / ACTION" directions for what is happening in the shots.
      4. CAMPAIGN AESTHETIC: To make these feel like a premium ad campaign, include photography directions in your prompts (e.g., "shot on 35mm, cinematic lighting, editorial composition, commercial product photography, dramatic depth of field, vibrant color grading").
      5. VARIATION: The 9 images should form a cohesive "set" showing different camera angles (close-up, wide shot, low angle) while adhering to the screen content guidelines.
      
      ${contextText}
      `;

      const conceptResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            ...conceptMediaParts,
            { text: conceptPrompt }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "Short title for the shot" },
                prompt: { type: Type.STRING, description: "Detailed visual prompt for an image generator" }
              },
              required: ["title", "prompt"]
            }
          }
        }
      });

      const concepts = JSON.parse(conceptResponse.text || '[]');
      const generatedItems: any[] = [];

      // 2. Generate 9 images sequentially to avoid rate limits and show progress
      for (let i = 0; i < Math.min(concepts.length, 9); i++) {
        setProgress(`Generating image ${i + 1} of 9...`);
        const concept = concepts[i];

        const imagePromptParts = [
          ...imageParts,
          { text: `Generate a high-end commercial campaign image based on this prompt: ${concept.prompt}. 
          
CRITICAL INTEGRATION RULES:
1. DO NOT just paste or superimpose the product/character over the background.
2. The subjects MUST physically exist within the 3D space of the environment.
3. They must cast realistic shadows onto the environment's surfaces (e.g., desks, floors).
4. They must reflect the environment's lighting and colors.
5. Ensure correct perspective, scale, and depth of field.

AESTHETIC: Masterpiece, photorealistic, award-winning commercial photography, cinematic lighting, 8k resolution.` }
        ];

        let imageUrl = '';
        let retries = 3;
        while (retries > 0 && !imageUrl) {
          try {
            const imgResponse = await ai.models.generateContent({
              model: 'gemini-2.5-flash-image',
              contents: { parts: imagePromptParts },
              config: {
                imageConfig: {
                  aspectRatio: "3:4",
                  imageSize: "1K"
                }
              }
            });

            for (const part of imgResponse.candidates?.[0]?.content?.parts || []) {
              if (part.inlineData) {
                imageUrl = `data:image/png;base64,${part.inlineData.data}`;
                break;
              }
            }

            if (imageUrl) {
              generatedItems.push({
                id: i,
                title: concept.title,
                prompt: concept.prompt,
                imageUrl
              });

              // Update output node incrementally
              setNodes(nds => nds.map(n => {
                if (targetNodeIds.includes(n.id) && n.type === 'campaignOutput') {
                  return { ...n, data: { ...n.data, items: [...generatedItems], status: `Generated ${i + 1} of 9...` } };
                }
                return n;
              }));
            }
            
            // Add a delay after a successful generation to prevent rate limits on the next one
            if (i < Math.min(concepts.length, 9) - 1) {
              await new Promise(resolve => setTimeout(resolve, 3000));
            }
          } catch (imgErr: any) {
            retries--;
            if (retries === 0) {
              console.error(`Failed to generate image ${i}:`, imgErr);
              break;
            }
            setProgress(`Rate limit hit, waiting to retry image ${i + 1}... (${retries} retries left)`);
            await new Promise(resolve => setTimeout(resolve, 8000)); // 8 second backoff
            setProgress(`Generating image ${i + 1} of 9...`);
          }
        }
      }

      setProgress('');
      setNodes(nds => nds.map(n => {
        if (targetNodeIds.includes(n.id) && n.type === 'campaignOutput') {
          return { ...n, data: { ...n.data, status: 'Complete!' } };
        }
        return n;
      }));

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to generate campaign');
    } finally {
      setIsGenerating(false);
      setProgress('');
    }
  };

  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm w-80 overflow-hidden">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-zinc-500 border-2 border-white" />
      <div className="p-3 border-b border-zinc-100 bg-zinc-50 flex items-center gap-2">
        <LayoutGrid className="w-4 h-4 text-indigo-500" />
        <span className="text-sm font-medium text-zinc-700">Campaign Generator (9x)</span>
      </div>
      <div className="p-4 space-y-4">
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">Campaign Theme / Concept</label>
          <textarea
            className="w-full text-sm p-2 border border-zinc-200 bg-white text-zinc-900 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 nodrag"
            rows={3}
            value={data.topic || ''}
            onChange={(e) => updateNodeData(id, { topic: e.target.value })}
            placeholder="e.g. Summer collection launch, neon cyberpunk style..."
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
          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-colors nodrag overflow-hidden"
        >
          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <Sparkles className="w-4 h-4 shrink-0" />}
          <span className="truncate">{isGenerating ? progress || 'Generating...' : 'Generate 9x Campaign'}</span>
        </button>
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-indigo-500 border-2 border-white" />
    </div>
  );
}

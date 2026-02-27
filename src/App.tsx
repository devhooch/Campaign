import { useState, useCallback, useRef } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  ReactFlowProvider,
  useReactFlow,
  Connection,
  Edge,
  Node
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { v4 as uuidv4 } from 'uuid';
import { LayoutTemplate, Package, User, MapPin, LayoutGrid, Sparkles, MonitorPlay, MessageSquare, Image as ImageIcon, Film } from 'lucide-react';

import { CampaignAssetNode } from './components/nodes/CampaignAssetNode';
import { CampaignGeneratorNode } from './components/nodes/CampaignGeneratorNode';
import { CampaignOutputNode } from './components/nodes/CampaignOutputNode';
import { CampaignTextNode } from './components/nodes/CampaignTextNode';
import { AssetGeneratorNode } from './components/nodes/AssetGeneratorNode';
import { SceneTimelineNode } from './components/nodes/SceneTimelineNode';
import { ChatNode } from './components/nodes/ChatNode';
import { GroupNode } from './components/nodes/GroupNode';

const nodeTypes = {
  campaignAsset: CampaignAssetNode,
  campaignGenerator: CampaignGeneratorNode,
  campaignOutput: CampaignOutputNode,
  campaignText: CampaignTextNode,
  assetGenerator: AssetGeneratorNode,
  sceneTimeline: SceneTimelineNode,
  chat: ChatNode,
  customGroup: GroupNode,
};

const initialNodes: Node[] = [
  // GROUPS
  {
    id: 'group-env',
    type: 'customGroup',
    position: { x: 50, y: 50 },
    style: { width: 450, height: 250 },
    data: { title: 'Environment Definition' },
    zIndex: -1,
  },
  {
    id: 'group-char',
    type: 'customGroup',
    position: { x: 50, y: 350 },
    style: { width: 450, height: 250 },
    data: { title: 'Hero / Character Definition' },
    zIndex: -1,
  },
  {
    id: 'group-screen',
    type: 'customGroup',
    position: { x: 50, y: 650 },
    style: { width: 450, height: 250 },
    data: { title: 'Screen Content Definition' },
    zIndex: -1,
  },
  {
    id: 'group-chat',
    type: 'customGroup',
    position: { x: 50, y: 950 },
    style: { width: 360, height: 450 },
    data: { title: 'Prompt Assistant' },
    zIndex: -1,
  },
  {
    id: 'group-scenes',
    type: 'customGroup',
    position: { x: 600, y: 50 },
    style: { width: 1100, height: 850 },
    data: { title: 'Scenes Showcase' },
    zIndex: -1,
  },
  {
    id: 'group-timeline',
    type: 'customGroup',
    position: { x: 1800, y: 50 },
    style: { width: 350, height: 850 },
    data: { title: 'Timeline & Structure' },
    zIndex: -1,
  },

  // ENVIRONMENT NODES
  {
    id: 'env-upload',
    type: 'campaignAsset',
    position: { x: 20, y: 50 },
    parentId: 'group-env',
    extent: 'parent',
    data: { assetType: 'environment', description: 'Office desk' },
  },
  
  // CHARACTER NODES
  {
    id: 'char-gen',
    type: 'assetGenerator',
    position: { x: 20, y: 50 },
    parentId: 'group-char',
    extent: 'parent',
    data: { title: 'Generate Character', prompt: 'A professional hand reaching out' },
  },

  // SCREEN CONTENT NODES
  {
    id: 'screen-content',
    type: 'campaignText',
    position: { x: 20, y: 50 },
    parentId: 'group-screen',
    extent: 'parent',
    data: { content: 'A glowing blue can of sparkling water floating above the laptop screen' },
  },

  // CHAT NODE
  {
    id: 'chat-1',
    type: 'chat',
    position: { x: 20, y: 40 },
    parentId: 'group-chat',
    extent: 'parent',
    data: {},
  },

  // SCENES NODES
  {
    id: 'generator-1',
    type: 'campaignGenerator',
    position: { x: 40, y: 50 },
    parentId: 'group-scenes',
    extent: 'parent',
    data: { topic: 'Product popping out of laptop screen' },
  },
  {
    id: 'output-1',
    type: 'campaignOutput',
    position: { x: 40, y: 350 },
    parentId: 'group-scenes',
    extent: 'parent',
    data: { items: [] },
  },

  // TIMELINE NODES
  {
    id: 'scene-1',
    type: 'sceneTimeline',
    position: { x: 40, y: 50 },
    parentId: 'group-timeline',
    extent: 'parent',
    data: { title: 'Scene 1', description: 'Intro shot' },
  },
  {
    id: 'scene-2',
    type: 'sceneTimeline',
    position: { x: 40, y: 400 },
    parentId: 'group-timeline',
    extent: 'parent',
    data: { title: 'Scene 2', description: 'Action shot' },
  }
];

const initialEdges: Edge[] = [
  { id: 'e1', source: 'env-upload', target: 'generator-1', animated: true, style: { stroke: '#52525b' } },
  { id: 'e2', source: 'char-gen', target: 'generator-1', animated: true, style: { stroke: '#52525b' } },
  { id: 'e3', source: 'screen-content', target: 'generator-1', animated: true, style: { stroke: '#52525b' } },
  { id: 'e4', source: 'generator-1', target: 'output-1', animated: true, style: { stroke: '#52525b' } },
  { id: 'e5', source: 'output-1', sourceHandle: 'item-0', target: 'scene-1', animated: true, style: { stroke: '#10b981' } },
  { id: 'e6', source: 'output-1', sourceHandle: 'item-1', target: 'scene-2', animated: true, style: { stroke: '#10b981' } }
];

function FlowCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { screenToFlowPosition } = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (typeof type === 'undefined' || !type) {
        return;
      }

      const assetType = event.dataTransfer.getData('application/assetType');

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: uuidv4(),
        type,
        position,
        data: { 
          assetType: assetType || undefined
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, setNodes],
  );

  return (
    <div className="flex-1 h-full relative" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        fitView
        className="bg-zinc-50"
      >
        <Background color="#e4e4e7" gap={16} />
        <Controls className="bg-white border-zinc-200 shadow-sm rounded-lg" />
        <MiniMap className="bg-white border-zinc-200 shadow-sm rounded-lg" maskColor="rgba(255,255,255,0.5)" nodeColor="#d4d4d8" />
      </ReactFlow>
    </div>
  );
}

function Sidebar() {
  const onDragStart = (event: React.DragEvent, nodeType: string, assetType?: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    if (assetType) {
      event.dataTransfer.setData('application/assetType', assetType);
    }
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-64 bg-white border-r border-zinc-200 flex flex-col h-full z-10 text-zinc-900">
      <div className="p-4 border-b border-zinc-200 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
          <LayoutTemplate className="w-4 h-4" />
        </div>
        <h1 className="font-semibold text-zinc-900">Campaign Forge</h1>
      </div>
      
      <div className="p-4 flex-1 overflow-y-auto">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-4">Drag to add nodes</p>
        
        <div className="space-y-3">
          <div 
            className="p-3 border border-zinc-200 rounded-lg bg-zinc-50 cursor-grab hover:border-blue-300 hover:bg-white transition-colors flex items-center gap-3"
            onDragStart={(event) => onDragStart(event, 'campaignAsset', 'product')}
            draggable
          >
            <Package className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-zinc-700">Product Mockup</span>
          </div>
          
          <div 
            className="p-3 border border-zinc-200 rounded-lg bg-zinc-50 cursor-grab hover:border-emerald-300 hover:bg-white transition-colors flex items-center gap-3"
            onDragStart={(event) => onDragStart(event, 'campaignAsset', 'environment')}
            draggable
          >
            <MapPin className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-medium text-zinc-700">Environment</span>
          </div>

          <div 
            className="p-3 border border-zinc-200 rounded-lg bg-zinc-50 cursor-grab hover:border-purple-300 hover:bg-white transition-colors flex items-center gap-3"
            onDragStart={(event) => onDragStart(event, 'campaignAsset', 'character')}
            draggable
          >
            <User className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-medium text-zinc-700">Hero / Character</span>
          </div>

          <div 
            className="p-3 border border-zinc-200 rounded-lg bg-zinc-50 cursor-grab hover:border-rose-300 hover:bg-white transition-colors flex items-center gap-3"
            onDragStart={(event) => onDragStart(event, 'campaignText')}
            draggable
          >
            <MonitorPlay className="w-4 h-4 text-rose-500" />
            <span className="text-sm font-medium text-zinc-700">Screen Content</span>
          </div>

          <div 
            className="p-3 border border-zinc-200 rounded-lg bg-zinc-50 cursor-grab hover:border-indigo-300 hover:bg-white transition-colors flex items-center gap-3"
            onDragStart={(event) => onDragStart(event, 'assetGenerator')}
            draggable
          >
            <ImageIcon className="w-4 h-4 text-indigo-500" />
            <span className="text-sm font-medium text-zinc-700">Asset Generator</span>
          </div>

          <div className="my-4 border-t border-zinc-200"></div>

          <div 
            className="p-3 border border-zinc-200 rounded-lg bg-zinc-50 cursor-grab hover:border-indigo-300 hover:bg-white transition-colors flex items-center gap-3"
            onDragStart={(event) => onDragStart(event, 'campaignGenerator')}
            draggable
          >
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span className="text-sm font-medium text-zinc-700">Campaign Generator</span>
          </div>

          <div 
            className="p-3 border border-zinc-200 rounded-lg bg-zinc-50 cursor-grab hover:border-zinc-300 hover:bg-white transition-colors flex items-center gap-3"
            onDragStart={(event) => onDragStart(event, 'campaignOutput')}
            draggable
          >
            <LayoutGrid className="w-4 h-4 text-zinc-500" />
            <span className="text-sm font-medium text-zinc-700">Campaign Board</span>
          </div>

          <div className="my-4 border-t border-zinc-200"></div>

          <div 
            className="p-3 border border-zinc-200 rounded-lg bg-zinc-50 cursor-grab hover:border-emerald-300 hover:bg-white transition-colors flex items-center gap-3"
            onDragStart={(event) => onDragStart(event, 'sceneTimeline')}
            draggable
          >
            <Film className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-medium text-zinc-700">Scene Timeline</span>
          </div>

          <div 
            className="p-3 border border-zinc-200 rounded-lg bg-zinc-50 cursor-grab hover:border-blue-300 hover:bg-white transition-colors flex items-center gap-3"
            onDragStart={(event) => onDragStart(event, 'chat')}
            draggable
          >
            <MessageSquare className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-zinc-700">Prompt Assistant</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default function App() {
  return (
    <div className="h-screen w-screen flex overflow-hidden font-sans bg-zinc-50 text-zinc-900">
      <Sidebar />
      <ReactFlowProvider>
        <FlowCanvas />
      </ReactFlowProvider>
    </div>
  );
}

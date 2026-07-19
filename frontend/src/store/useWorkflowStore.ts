import { create } from 'zustand';
import { Node, Edge } from '@xyflow/react';

interface WorkflowState {
  nodes: Node[];
  edges: Edge[];
  loadedWorkflowId: string | null;
  workflowName: string;
  setNodes: (nodes: Node[] | ((prev: Node[]) => Node[])) => void;
  setEdges: (edges: Edge[] | ((prev: Edge[]) => Edge[])) => void;
  setLoadedWorkflowId: (id: string | null) => void;
  setWorkflowName: (name: string) => void;
  updateNodeDiffState: (id: string, diffState: 'added' | 'modified' | 'deleted' | null) => void;
  reset: () => void;
}



export const useWorkflowStore = create<WorkflowState>((set) => ({
  nodes: [],
  edges: [],
  loadedWorkflowId: null,
  workflowName: 'My n8n Workflow',

  setNodes: (nodesOrUpdater) => set((state) => ({
    nodes: typeof nodesOrUpdater === 'function' ? nodesOrUpdater(state.nodes) : nodesOrUpdater
  })),

  setEdges: (edgesOrUpdater) => set((state) => ({
    edges: typeof edgesOrUpdater === 'function' ? edgesOrUpdater(state.edges) : edgesOrUpdater
  })),

  setLoadedWorkflowId: (id) => set({ loadedWorkflowId: id }),
  setWorkflowName: (name) => set({ workflowName: name }),

  updateNodeDiffState: (id, diffState) => set((state) => ({
    nodes: state.nodes.map(n => 
      n.id === id ? { ...n, data: { ...n.data, diffState } } : n
    )
  })),

  reset: () => set({ nodes: [], edges: [], loadedWorkflowId: null, workflowName: 'My n8n Workflow' })
}));

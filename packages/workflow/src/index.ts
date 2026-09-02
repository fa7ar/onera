import type { UUID } from '@onera/core';

export type WorkflowState = 'idle' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface WorkflowStep {
  id: string;
  name: string;
  handler: (context: WorkflowContext) => Promise<void>;
}

export interface WorkflowContext {
  workflowId: UUID;
  organizationId: UUID;
  workspaceId: UUID;
  userId: UUID;
  data: Record<string, unknown>;
}

export interface Workflow {
  id: UUID;
  name: string;
  steps: WorkflowStep[];
  state: WorkflowState;
  currentStep: number;
  context: WorkflowContext;
}

export interface WorkflowEnginePort {
  register(name: string, steps: WorkflowStep[]): void;
  start(name: string, context: Omit<WorkflowContext, 'workflowId'>): Promise<Workflow>;
  cancel(workflowId: UUID): Promise<void>;
  getStatus(workflowId: UUID): Promise<Workflow | null>;
}

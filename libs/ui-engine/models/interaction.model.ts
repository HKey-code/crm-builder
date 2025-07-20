export interface Interaction {
  id: string;
  event: string; // e.g., "click", "submit", "change"
  action: string; // Action to perform
  targetComponentId?: string; // Target component for the action
  params?: Record<string, any>; // Action parameters
  conditions?: Record<string, any>; // Conditions for the interaction
  componentInstanceId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateInteractionInput {
  event: string;
  action: string;
  targetComponentId?: string;
  params?: Record<string, any>;
  conditions?: Record<string, any>;
  componentInstanceId: string;
}

export interface UpdateInteractionInput {
  event?: string;
  action?: string;
  targetComponentId?: string;
  params?: Record<string, any>;
  conditions?: Record<string, any>;
} 
import type { ChoiceConfig } from '../features/scripting/types';

export type ChoiceNodeData = {
  kind: 'choice';
  label?: string;
  choice: ChoiceConfig;
};

export type InputType = 'text' | 'singleSelect' | 'multiSelect' | 'radio' | 'checkbox';

export type InputOption = { label: string; value: string };

export type InputNodeData = {
  kind: 'input';
  /** Prompt/title shown above or near the input */
  title?: string;
  /** Machine name that will be written to context */
  varName?: string;
  /** Input control kind */
  inputType: InputType;
  /** Placeholder for text (or general hint) */
  placeholder?: string;
  /** Required flag */
  required?: boolean;
  /** Options for select/radio/checkbox */
  options?: InputOption[];
};


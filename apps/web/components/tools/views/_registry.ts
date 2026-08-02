import type { ComponentType } from 'react';
import type { ToolDef } from '@/lib/tools-registry';

/** A tool view renders the body of a tool page (below the shared ToolHeader). */
export type ToolViewProps = { tool: ToolDef };
export type ToolViewMap = Record<string, ComponentType<ToolViewProps>>;

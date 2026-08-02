import type { ComponentType } from 'react';
import type { ToolDef } from '@/lib/tools-registry';
import type { ToolData } from '@/lib/tools/data';

/** A tool view renders the body of a tool page (below the shared ToolHeader).
 *  `data` is the computed tool payload from the synced store; undefined when no
 *  account is connected (the view renders its own connect/empty state). */
export type ToolViewProps = { tool: ToolDef; data?: ToolData };
export type ToolViewMap = Record<string, ComponentType<ToolViewProps>>;

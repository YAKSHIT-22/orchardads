import { analyticsViews } from './analytics';
import { audienceViews } from './audience';
import { creativeViews } from './creative';
import { growthViews } from './growth';
import { managementViews } from './management';
import type { ToolViewMap } from './_registry';

/** slug -> view component. A tool with a view renders it; others fall back to
 *  the status-based empty state on the tool detail page. */
export const TOOL_VIEWS: ToolViewMap = {
  ...analyticsViews,
  ...creativeViews,
  ...audienceViews,
  ...growthViews,
  ...managementViews,
};

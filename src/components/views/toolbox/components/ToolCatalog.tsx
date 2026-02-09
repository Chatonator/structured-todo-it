import React from 'react';
import { cn } from '@/lib/utils';
import { ToolDefinition, TOOL_CATEGORIES } from '../tools/types';
import ToolCard from './ToolCard';

interface ToolCatalogProps {
  tools: ToolDefinition[];
  onSelectTool: (toolId: string) => void;
  onQuickLaunch?: (toolId: string) => void;
  launchedTools?: string[];
  groupByCategory?: boolean;
}

const ToolCatalog: React.FC<ToolCatalogProps> = ({ 
  tools, 
  onSelectTool,
  onQuickLaunch,
  launchedTools = [],
  groupByCategory = false 
}) => {
  const renderToolCard = (tool: ToolDefinition) => (
    <ToolCard
      key={tool.id}
      tool={tool}
      onClick={() => onSelectTool(tool.id)}
      onQuickLaunch={onQuickLaunch ? () => onQuickLaunch(tool.id) : undefined}
      hasBeenLaunched={launchedTools.includes(tool.id)}
    />
  );

  if (groupByCategory) {
    // Group tools by category
    const groupedTools = TOOL_CATEGORIES.map(category => ({
      ...category,
      tools: tools.filter(t => t.category === category.id)
    })).filter(group => group.tools.length > 0);

    return (
      <div className="space-y-8">
        {groupedTools.map(group => (
          <div key={group.id}>
            <div className="mb-4">
              <h3 className="font-semibold text-lg">{group.name}</h3>
              <p className="text-sm text-muted-foreground">{group.description}</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {group.tools.map(renderToolCard)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Simple grid without grouping
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {tools.map(renderToolCard)}
    </div>
  );
};

export default ToolCatalog;

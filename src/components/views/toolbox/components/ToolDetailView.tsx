import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Check, ChevronDown, ExternalLink, Lightbulb, History, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ToolDefinition } from '../tools/types';

interface ToolDetailViewProps {
  tool: ToolDefinition;
  onLaunch: () => void;
}

const ToolDetailView: React.FC<ToolDetailViewProps> = ({ tool, onLaunch }) => {
  const [originOpen, setOriginOpen] = useState(false);
  const [tipsOpen, setTipsOpen] = useState(false);

  const Icon = tool.icon;

  return (
    <div className="flex flex-col items-center max-w-2xl mx-auto py-8 px-4">
      {/* Large icon */}
      <div className={cn(
        "w-24 h-24 rounded-2xl flex items-center justify-center mb-6",
        tool.bgColor
      )}>
        <Icon className={cn("w-12 h-12", tool.color)} />
      </div>

      {/* Title & short description */}
      <h2 className="text-2xl font-bold text-center mb-2">{tool.name}</h2>
      <p className="text-muted-foreground text-center mb-6">{tool.description}</p>

      {/* Long description */}
      {tool.longDescription && (
        <p className="text-sm text-foreground/80 text-center leading-relaxed mb-8 max-w-lg">
          {tool.longDescription}
        </p>
      )}

      {/* Benefits */}
      {tool.benefits && tool.benefits.length > 0 && (
        <div className="w-full mb-8">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Avantages
          </h3>
          <ul className="space-y-2">
            {tool.benefits.map((benefit, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-primary" />
                </div>
                <span className="text-sm">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Launch button */}
      <Button 
        size="lg" 
        onClick={onLaunch}
        className="mb-8 gap-2"
      >
        <Play className="w-4 h-4" />
        Lancer l'outil
      </Button>

      {/* Collapsible sections */}
      <div className="w-full space-y-3">
        {/* Origin */}
        {tool.origin && (
          <Collapsible open={originOpen} onOpenChange={setOriginOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Origine et histoire</span>
              </div>
              <ChevronDown className={cn(
                "w-4 h-4 text-muted-foreground transition-transform",
                originOpen && "rotate-180"
              )} />
            </CollapsibleTrigger>
            <CollapsibleContent className="px-3 pt-3">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {tool.origin}
              </p>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Tips */}
        {tool.tips && tool.tips.length > 0 && (
          <Collapsible open={tipsOpen} onOpenChange={setTipsOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Conseils d'utilisation</span>
              </div>
              <ChevronDown className={cn(
                "w-4 h-4 text-muted-foreground transition-transform",
                tipsOpen && "rotate-180"
              )} />
            </CollapsibleTrigger>
            <CollapsibleContent className="px-3 pt-3">
              <ul className="space-y-2">
                {tool.tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-primary">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>

      {/* External link */}
      {tool.learnMoreUrl && (
        <a 
          href={tool.learnMoreUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          En savoir plus
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}
    </div>
  );
};

export default ToolDetailView;

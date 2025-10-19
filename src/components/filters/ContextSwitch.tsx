import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Briefcase, Home } from 'lucide-react';
import { TaskContext } from '@/types/task';

interface ContextSwitchProps {
  value: TaskContext | 'all';
  onValueChange: (value: TaskContext | 'all') => void;
}

/**
 * Switch principal Pro/Perso
 * Permet de basculer entre les deux univers
 */
const ContextSwitch: React.FC<ContextSwitchProps> = ({ value, onValueChange }) => {
  return (
    <Tabs value={value} onValueChange={onValueChange} className="w-auto">
      <TabsList className="grid w-full grid-cols-3 h-9 bg-muted/50 p-1">
        <TabsTrigger 
          value="all" 
          className="text-xs data-[state=active]:bg-background data-[state=active]:text-foreground transition-all"
        >
          Tous
        </TabsTrigger>
        <TabsTrigger 
          value="Pro" 
          className="text-xs data-[state=active]:bg-context-pro data-[state=active]:text-white transition-all"
        >
          <Briefcase className="w-3 h-3 mr-1" />
          Pro
        </TabsTrigger>
        <TabsTrigger 
          value="Perso" 
          className="text-xs data-[state=active]:bg-context-perso data-[state=active]:text-white transition-all"
        >
          <Home className="w-3 h-3 mr-1" />
          Perso
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

export default ContextSwitch;

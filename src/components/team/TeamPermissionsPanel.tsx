import React from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { ChevronDown, Shield } from 'lucide-react';
import {
  ALL_PERMISSIONS, PERMISSION_LABELS, CONFIGURABLE_ROLES, ROLE_LABELS, hasPermission,
  type PermissionsConfig, type TeamPermission,
} from '@/lib/teamPermissions';

interface TeamPermissionsPanelProps {
  config: PermissionsConfig;
  onUpdate: (config: PermissionsConfig) => void;
}

export const TeamPermissionsPanel: React.FC<TeamPermissionsPanelProps> = ({ config, onUpdate }) => {
  const toggle = (role: 'admin' | 'supervisor' | 'member' | 'guest', perm: TeamPermission) => {
    const current = hasPermission(role, perm, config);
    const newConfig: PermissionsConfig = {
      ...config,
      [role]: {
        ...config[role],
        [perm]: !current,
      },
    };
    onUpdate(newConfig);
  };

  return (
    <Collapsible>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-lg">Gestion des droits</CardTitle>
                <CardDescription>Configurez les permissions par rôle</CardDescription>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground ml-auto transition-transform [[data-state=open]_&]:rotate-180" />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Permission</th>
                    {CONFIGURABLE_ROLES.map((role) => (
                      <th key={role} className="text-center py-2 px-3 font-medium text-muted-foreground">
                        {ROLE_LABELS[role]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ALL_PERMISSIONS.map((perm) => (
                    <tr key={perm} className="border-b last:border-0">
                      <td className="py-2.5 pr-4">{PERMISSION_LABELS[perm]}</td>
                      {CONFIGURABLE_ROLES.map((role) => (
                        <td key={role} className="text-center py-2.5 px-3">
                          <Switch
                            checked={hasPermission(role, perm, config)}
                            onCheckedChange={() => toggle(role, perm)}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

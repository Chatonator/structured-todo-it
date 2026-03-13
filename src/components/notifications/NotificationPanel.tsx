import React, { useState } from 'react';
import { useNotifications, type Notification } from '@/hooks/useNotifications';
import { useTeamContext } from '@/contexts/TeamContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Check, CheckCheck, Trash2, Info, Users, Sparkles, AlertTriangle, ChevronDown, ChevronUp, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { headerSurfaceVariants } from '@/components/primitives/visual';

const typeIcons: Record<string, React.ReactNode> = {
  info: <Info className="w-4 h-4 text-primary" />,
  team: <Users className="w-4 h-4 text-blue-500" />,
  update: <Sparkles className="w-4 h-4 text-amber-500" />,
  warning: <AlertTriangle className="w-4 h-4 text-destructive" />,
};

const MESSAGE_PREVIEW_LENGTH = 80;

const NotificationItem: React.FC<{
  notification: Notification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  onRespondInvitation?: (invitationId: string, accept: boolean) => Promise<boolean>;
}> = ({ notification, onMarkRead, onDelete, onRespondInvitation }) => {
  const [expanded, setExpanded] = useState(false);
  const [responding, setResponding] = useState(false);
  const hasLongMessage = (notification.message?.length ?? 0) > MESSAGE_PREVIEW_LENGTH;
  const displayMessage = expanded ? notification.message : notification.message?.slice(0, MESSAGE_PREVIEW_LENGTH);

  const metadata = notification.metadata as Record<string, unknown> | null;
  const isTeamInvitation = metadata?.action === 'team_invitation';
  const invitationId = metadata?.invitation_id as string | undefined;

  const handleRespond = async (accept: boolean) => {
    if (!invitationId || !onRespondInvitation) return;
    setResponding(true);
    await onRespondInvitation(invitationId, accept);
    onMarkRead(notification.id);
    setResponding(false);
  };

  return (
    <div className={cn('group flex items-start gap-3 rounded-lg p-3 transition-colors', notification.is_read ? 'opacity-60' : 'bg-primary/5')}>
      <div className="mt-0.5 flex-shrink-0">{typeIcons[notification.type] ?? typeIcons.info}</div>
      <div className="min-w-0 flex-1">
        <p className={cn('text-sm leading-tight', !notification.is_read && 'font-medium')}>{notification.title}</p>
        {notification.message && (
          <div className="mt-0.5">
            <p className="text-xs whitespace-pre-wrap text-muted-foreground">
              {displayMessage}
              {hasLongMessage && !expanded && '…'}
            </p>
            {hasLongMessage && (
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  setExpanded(!expanded);
                }}
                className="mt-1 inline-flex items-center gap-0.5 text-[11px] font-medium text-primary transition-colors hover:text-primary/80"
              >
                {expanded ? (
                  <>Réduire <ChevronUp className="h-3 w-3" /></>
                ) : (
                  <>Voir plus <ChevronDown className="h-3 w-3" /></>
                )}
              </button>
            )}
          </div>
        )}
        {isTeamInvitation && !notification.is_read && invitationId && onRespondInvitation && (
          <div className="mt-2 flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-7 gap-1 text-xs text-destructive hover:text-destructive" onClick={() => handleRespond(false)} disabled={responding}>
              <X className="h-3 w-3" />
              Refuser
            </Button>
            <Button size="sm" className="h-7 gap-1 text-xs" onClick={() => handleRespond(true)} disabled={responding}>
              <Check className="h-3 w-3" />
              Accepter
            </Button>
          </div>
        )}
        <p className="mt-1 text-[11px] text-muted-foreground/70">
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: fr })}
        </p>
      </div>
      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {!notification.is_read && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onMarkRead(notification.id)}>
            <Check className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => onDelete(notification.id)}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};

export const NotificationPanel: React.FC = () => {
  const {
    generalNotifications,
    updateNotifications,
    unreadCount,
    unreadGeneralCount,
    unreadUpdatesCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();
  const { respondToInvitation } = useTeamContext();

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(headerSurfaceVariants({ density: 'desktop' }), 'header-chip-inactive relative h-10 w-10 p-0')}
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Notifications</TooltipContent>
      </Tooltip>

      <PopoverContent className="flex h-[min(80vh,34rem)] w-[22rem] flex-col overflow-hidden p-0" align="end" sideOffset={8}>
        <Tabs defaultValue="notifications" className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="type-section-title text-sm">Centre d’alertes</h3>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" onClick={markAllAsRead}>
                <CheckCheck className="h-3.5 w-3.5" />
                Tout lire
              </Button>
            )}
          </div>

          <div className="border-b border-border px-3 py-2">
            <TabsList className="grid h-9 w-full grid-cols-2">
              <TabsTrigger value="notifications" className="text-xs">
                Notifications
                {unreadGeneralCount > 0 && <span className="ml-1.5 text-[11px] text-primary">({unreadGeneralCount})</span>}
              </TabsTrigger>
              <TabsTrigger value="updates" className="text-xs">
                Mises à jour
                {unreadUpdatesCount > 0 && <span className="ml-1.5 text-[11px] text-primary">({unreadUpdatesCount})</span>}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="notifications" className="mt-0 flex min-h-0 flex-1 flex-col">
            <ScrollArea className="min-h-0 flex-1">
              {loading ? (
                <div className="p-6 text-center text-sm text-muted-foreground">Chargement…</div>
              ) : generalNotifications.length === 0 ? (
                <div className="p-6 text-center">
                  <Bell className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">Aucune notification</p>
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {generalNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkRead={markAsRead}
                      onDelete={deleteNotification}
                      onRespondInvitation={respondToInvitation}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="updates" className="mt-0 flex min-h-0 flex-1 flex-col">
            <ScrollArea className="min-h-0 flex-1">
              {loading ? (
                <div className="p-6 text-center text-sm text-muted-foreground">Chargement…</div>
              ) : updateNotifications.length === 0 ? (
                <div className="p-6 text-center">
                  <Sparkles className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">Aucune mise à jour récente</p>
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {updateNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkRead={markAsRead}
                      onDelete={deleteNotification}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationPanel;

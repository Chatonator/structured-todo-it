import React from 'react';
import { useNotifications, type Notification } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Bell, Check, CheckCheck, Trash2, Info, Users, Sparkles, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const typeIcons: Record<string, React.ReactNode> = {
  info: <Info className="w-4 h-4 text-primary" />,
  team: <Users className="w-4 h-4 text-blue-500" />,
  update: <Sparkles className="w-4 h-4 text-amber-500" />,
  warning: <AlertTriangle className="w-4 h-4 text-destructive" />,
};

const NotificationItem: React.FC<{
  notification: Notification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}> = ({ notification, onMarkRead, onDelete }) => (
  <div
    className={cn(
      "flex items-start gap-3 p-3 rounded-lg transition-colors group",
      notification.is_read ? "opacity-60" : "bg-primary/5"
    )}
  >
    <div className="flex-shrink-0 mt-0.5">
      {typeIcons[notification.type] ?? typeIcons.info}
    </div>
    <div className="flex-1 min-w-0">
      <p className={cn("text-sm leading-tight", !notification.is_read && "font-medium")}>
        {notification.title}
      </p>
      {notification.message && (
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notification.message}</p>
      )}
      <p className="text-[11px] text-muted-foreground/70 mt-1">
        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: fr })}
      </p>
    </div>
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      {!notification.is_read && (
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onMarkRead(notification.id)}>
          <Check className="w-3.5 h-3.5" />
        </Button>
      )}
      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => onDelete(notification.id)}>
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  </div>
);

export const NotificationPanel: React.FC = () => {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative text-muted-foreground hover:text-foreground"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 text-[10px] font-bold bg-destructive text-destructive-foreground rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Notifications</TooltipContent>
      </Tooltip>

      <PopoverContent className="w-80 p-0" align="end" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5" onClick={markAllAsRead}>
              <CheckCheck className="w-3.5 h-3.5" />
              Tout lire
            </Button>
          )}
        </div>

        {/* List */}
        <ScrollArea className="max-h-[400px]">
          {loading ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Chargement…</div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center">
              <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Aucune notification</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {notifications.map(n => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onMarkRead={markAsRead}
                  onDelete={deleteNotification}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationPanel;

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { TeamComment } from '@/hooks/useTeamComments';
import type { TeamMember } from '@/hooks/useTeams';

interface TeamCommentThreadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string;
  taskName: string;
  comments: TeamComment[];
  loading: boolean;
  members: TeamMember[];
  currentUserId: string | null;
  onLoadComments: (taskId: string) => void;
  onAddComment: (taskId: string, content: string) => Promise<boolean>;
  onDeleteComment: (commentId: string, taskId: string) => void;
}

const getInitials = (name: string | null | undefined): string => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export const TeamCommentThread: React.FC<TeamCommentThreadProps> = ({
  open, onOpenChange, taskId, taskName,
  comments, loading, members, currentUserId,
  onLoadComments, onAddComment, onDeleteComment,
}) => {
  const [newComment, setNewComment] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open && taskId) onLoadComments(taskId);
  }, [open, taskId, onLoadComments]);

  const handleSend = async () => {
    if (!newComment.trim()) return;
    setSending(true);
    const ok = await onAddComment(taskId, newComment.trim());
    if (ok) setNewComment('');
    setSending(false);
  };

  const getMember = (userId: string) => members.find(m => m.user_id === userId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base truncate">💬 {taskName}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] pr-2">
          {loading && <p className="text-sm text-muted-foreground text-center py-4">Chargement…</p>}
          {!loading && comments.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">Aucun commentaire pour le moment</p>
          )}
          <div className="space-y-3">
            {comments.map(c => {
              const member = getMember(c.user_id);
              const isMe = c.user_id === currentUserId;
              return (
                <div key={c.id} className="flex gap-2 group">
                  <Avatar className="h-7 w-7 flex-shrink-0 mt-0.5">
                    <AvatarFallback className="text-[9px] bg-primary/15 text-primary">
                      {getInitials(member?.profiles?.display_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-medium">
                        {member?.profiles?.display_name || 'Membre'}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: fr })}
                      </span>
                      {isMe && (
                        <button
                          onClick={() => onDeleteComment(c.id, taskId)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
                        >
                          <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm mt-0.5 whitespace-pre-wrap break-words">{c.content}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <div className="flex gap-2 pt-2 border-t">
          <Textarea
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="Écrire un commentaire…"
            className="min-h-[60px] text-sm resize-none"
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSend();
            }}
          />
          <Button
            size="sm"
            className="self-end h-9 px-3"
            disabled={!newComment.trim() || sending}
            onClick={handleSend}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

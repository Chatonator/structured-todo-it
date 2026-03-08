import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, LogIn, Loader2, CheckCircle2, XCircle, UserPlus } from 'lucide-react';

const JoinTeam = () => {
  const { code } = useParams<{ code: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [teamName, setTeamName] = useState<string | null>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [status, setStatus] = useState<'loading' | 'found' | 'joined' | 'already' | 'error' | 'disabled'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!code || authLoading) return;

    const resolve = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('join-team-public', {
          body: { inviteCode: code },
        });

        if (error || data?.error) {
          const msg = data?.error || 'Lien invalide';
          if (msg.includes('désactivées')) {
            setStatus('disabled');
          } else {
            setStatus('error');
          }
          setErrorMsg(msg);
          return;
        }

        setTeamName(data.team.name);
        setMemberCount(data.team.memberCount);

        if (data.alreadyMember) {
          setStatus('already');
        } else {
          setStatus('found');
        }
      } catch {
        setStatus('error');
        setErrorMsg('Impossible de charger les informations');
      }
    };

    resolve();
  }, [code, authLoading, user]);

  // Auto-redirect if already member
  useEffect(() => {
    if (status === 'already') {
      const timer = setTimeout(() => navigate('/'), 2500);
      return () => clearTimeout(timer);
    }
  }, [status, navigate]);

  // Auto-redirect after successful join
  useEffect(() => {
    if (status === 'joined') {
      const timer = setTimeout(() => navigate('/'), 2500);
      return () => clearTimeout(timer);
    }
  }, [status, navigate]);

  const handleJoin = async () => {
    if (!code) return;
    setJoining(true);
    try {
      const { data, error } = await supabase.functions.invoke('join-team', {
        body: { inviteCode: code },
      });
      if (error || data?.error) {
        setErrorMsg(data?.error || 'Erreur lors de la connexion');
        setStatus('error');
      } else {
        setStatus('joined');
      }
    } catch {
      setErrorMsg('Erreur inattendue');
      setStatus('error');
    }
    setJoining(false);
  };

  if (authLoading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/5">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 to-secondary/5">
      <Card className="w-full max-w-md shadow-xl border-0 bg-card/95 backdrop-blur-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            {status === 'error' || status === 'disabled' ? (
              <XCircle className="w-8 h-8 text-destructive" />
            ) : status === 'joined' || status === 'already' ? (
              <CheckCircle2 className="w-8 h-8 text-primary" />
            ) : (
              <Users className="w-8 h-8 text-primary" />
            )}
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">
              {status === 'error' ? 'Lien invalide' :
               status === 'disabled' ? 'Inscriptions fermées' :
               status === 'joined' ? 'Bienvenue !' :
               status === 'already' ? 'Déjà membre' :
               'Invitation d\'équipe'}
            </CardTitle>
            {teamName && (
              <CardDescription className="text-base mt-2">
                {status === 'joined'
                  ? `Vous avez rejoint ${teamName} en tant qu'invité`
                  : status === 'already'
                  ? `Vous êtes déjà membre de ${teamName}`
                  : `Vous êtes invité à rejoindre ${teamName}`}
              </CardDescription>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'error' && (
            <p className="text-center text-sm text-muted-foreground">{errorMsg}</p>
          )}

          {status === 'disabled' && (
            <p className="text-center text-sm text-muted-foreground">
              Cette équipe n'accepte plus les nouvelles inscriptions via lien.
            </p>
          )}

          {status === 'found' && !user && (
            <div className="space-y-3 text-center">
              <p className="text-sm text-muted-foreground">
                {memberCount} membre{memberCount > 1 ? 's' : ''} • Connectez-vous ou inscrivez-vous pour rejoindre.
              </p>
              <Button
                className="w-full gap-2"
                onClick={() => navigate(`/auth?redirect=/join/${code}`)}
              >
                <LogIn className="w-4 h-4" />
                Se connecter / S'inscrire
              </Button>
            </div>
          )}

          {status === 'found' && user && (
            <div className="space-y-3 text-center">
              <p className="text-sm text-muted-foreground">
                {memberCount} membre{memberCount > 1 ? 's' : ''} • Vous rejoindrez en tant qu'invité (lecture seule).
                <br />Un superviseur ou admin pourra vous promouvoir.
              </p>
              <Button
                className="w-full gap-2"
                onClick={handleJoin}
                disabled={joining}
              >
                <UserPlus className="w-4 h-4" />
                {joining ? 'Connexion...' : "Rejoindre l'équipe"}
              </Button>
            </div>
          )}

          {(status === 'joined' || status === 'already') && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-3">Redirection automatique…</p>
              <Button variant="outline" onClick={() => navigate('/')}>
                Aller au tableau de bord
              </Button>
            </div>
          )}

          {(status === 'error' || status === 'disabled') && (
            <div className="text-center">
              <Button variant="outline" onClick={() => navigate('/')}>
                Retour à l'accueil
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default JoinTeam;



# Sécurisation et amélioration du système d'invitation

## Problèmes identifiés

1. **Code trop court** : 8 caractères (alphabet de 31) = ~850 milliards de combinaisons. Suffisant mais vulnérable au brute-force sans rate limiting. Passer à **12 caractères** = ~7.8 × 10^17 combinaisons.

2. **`create-team` utilise `Math.random()`** au lieu de `crypto.getRandomValues()` pour générer le code initial — pas cryptographiquement sûr.

3. **Aucun rate limiting** sur les endpoints `join-team` et `join-team-public`. Un attaquant peut tester des codes en masse.

4. **Pas de distinction visuelle** entre les invités connectés et ceux sans compte dans la liste des membres (un invité via lien public sans compte n'apparaît pas du tout actuellement, ce qui est correct — mais un invité connecté n'est pas distingué d'un membre classique au-delà du badge).

5. **Auto-join silencieux** : `join-team-public` ajoute automatiquement l'utilisateur connecté comme guest sans confirmation explicite.

## Changements proposés

### 1. Codes d'invitation de 12 caractères

**Fichiers** : `create-team/index.ts`, `regenerate-invite-code/index.ts`
- Passer la longueur de génération de 8 à 12 caractères
- `create-team` : remplacer `Math.random()` par `crypto.getRandomValues()`
- Format d'affichage : groupé par 4 (`XXXX-XXXX-XXXX`) pour lisibilité

### 2. Rate limiting simple côté Edge Functions

**Fichiers** : `join-team/index.ts`, `join-team-public/index.ts`
- Ajouter un compteur d'échecs par IP dans un header de réponse
- Limiter à **5 tentatives échouées par minute par IP** via un Map en mémoire (reset au redéploiement, suffisant pour dissuader le brute-force casual)
- Retourner HTTP 429 si dépassé

### 3. Affichage amélioré des membres

**Fichier** : `TeamMembersList.tsx`
- Pour les guests : afficher une icône distincte + mention "(lecture seule)" à côté du nom
- Ajouter la date d'arrivée (`joined_at`) en sous-texte pour identifier les invités récents

### 4. Formatage du code pour l'affichage

**Fichier** : `TeamTasksView.tsx`
- Afficher le code groupé : `XXXX-XXXX-XXXX` au lieu de `XXXXXXXXXXXX`
- Le copier-coller reste sans tirets (le join-team fait un `.trim().toUpperCase()` et on ajoutera un `.replace(/-/g, '')`)

### 5. Nettoyage du flux join-team-public

**Fichier** : `join-team-public/index.ts`
- Ne plus auto-join l'utilisateur connecté comme guest
- Retourner simplement les infos de l'équipe (nom, nombre de membres)
- L'ajout effectif se fait uniquement via le bouton explicite sur la page JoinTeam

**Fichier** : `JoinTeam.tsx`
- Ajouter un bouton "Rejoindre en tant qu'invité" pour les utilisateurs connectés (au lieu de l'auto-join)
- Appeler `join-team` (authentifié) au clic

### 6. Accepter les codes avec ou sans tirets

**Fichiers** : `join-team/index.ts`, `join-team-public/index.ts`
- Nettoyer l'input : `inviteCode.replace(/-/g, '').trim().toUpperCase()`

## Résumé des fichiers

| Fichier | Action |
|---|---|
| `supabase/functions/create-team/index.ts` | Code 12 chars + `crypto.getRandomValues` |
| `supabase/functions/regenerate-invite-code/index.ts` | Code 12 chars |
| `supabase/functions/join-team/index.ts` | Rate limiting + strip tirets |
| `supabase/functions/join-team-public/index.ts` | Rate limiting + strip tirets + suppression auto-join |
| `src/pages/JoinTeam.tsx` | Bouton "Rejoindre" explicite au lieu d'auto-join |
| `src/components/views/teams/TeamTasksView.tsx` | Affichage formaté `XXXX-XXXX-XXXX` |
| `src/components/team/TeamMembersList.tsx` | Date d'arrivée + mention lecture seule pour guests |


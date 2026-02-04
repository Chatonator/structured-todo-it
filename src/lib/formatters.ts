/**
 * Utilitaires de formatage centralisés
 * Utilisés par toutes les vues pour assurer une cohérence
 */

import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday, differenceInDays, differenceInWeeks, differenceInMonths } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Formate une durée en minutes vers un format lisible
 * @param minutes - Nombre de minutes
 * @returns String formatée (ex: "5m", "1h30", "2h")
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h${remainingMinutes}` : `${hours}h`;
}

/**
 * Formate une date selon un format spécifié
 * @param date - Date à formater
 * @param formatStr - Format date-fns (défaut: 'dd/MM/yyyy')
 * @returns String formatée
 */
export function formatDate(date: Date | string, formatStr: string = 'dd/MM/yyyy'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, formatStr, { locale: fr });
}

/**
 * Formate une date de façon relative et contextuelle
 * @param date - Date à formater
 * @returns String comme "Aujourd'hui", "Demain", "Il y a 2 jours", etc.
 */
export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isToday(d)) return "Aujourd'hui";
  if (isTomorrow(d)) return "Demain";
  if (isYesterday(d)) return "Hier";
  
  return formatDistanceToNow(d, { addSuffix: true, locale: fr });
}

/**
 * Formate une heure
 * @param date - Date contenant l'heure
 * @returns String au format "HH:mm"
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'HH:mm', { locale: fr });
}

/**
 * Formate un nombre avec séparateur de milliers
 * @param num - Nombre à formater
 * @returns String formatée
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('fr-FR').format(num);
}

/**
 * Formate un pourcentage
 * @param value - Valeur (0-100 ou 0-1)
 * @param decimals - Nombre de décimales
 * @returns String formatée avec %
 */
export function formatPercentage(value: number, decimals: number = 0): string {
  const normalizedValue = value > 1 ? value : value * 100;
  return `${normalizedValue.toFixed(decimals)}%`;
}

/**
 * Formate une durée relative depuis maintenant (pour l'activité récente)
 * @param date - Date à formater
 * @returns String comme "À l'instant", "Il y a 5min", "Il y a 2h", "Il y a 3j"
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes}min`;
  if (hours < 24) return `Il y a ${hours}h`;
  return `Il y a ${days}j`;
}

/**
 * Formate une durée en format long (pour les vues avec plus d'espace)
 * @param minutes - Nombre de minutes
 * @returns String formatée (ex: "5 min", "1h 30min", "2h")
 */
export function formatDurationLong(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
}

/**
 * Formate l'ancienneté d'une tâche de façon compacte
 * @param date - Date de création
 * @returns String comme "3j", "2sem", "1mois", "Aujourd'hui"
 */
export function formatAge(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  
  if (isToday(d)) return "Aujourd'hui";
  
  const days = differenceInDays(now, d);
  const weeks = differenceInWeeks(now, d);
  const months = differenceInMonths(now, d);
  
  if (days < 7) return `${days}j`;
  if (weeks < 4) return `${weeks}sem`;
  if (months < 12) return `${months}mois`;
  return `${Math.floor(months / 12)}an${Math.floor(months / 12) > 1 ? 's' : ''}`;
}

/**
 * Formate l'ancienneté en version longue
 * @param date - Date de création
 * @returns String comme "3 jours", "2 semaines", "1 mois"
 */
export function formatAgeLong(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  
  if (isToday(d)) return "Aujourd'hui";
  if (isYesterday(d)) return "Hier";
  
  const days = differenceInDays(now, d);
  const weeks = differenceInWeeks(now, d);
  const months = differenceInMonths(now, d);
  
  if (days < 7) return `${days} jour${days > 1 ? 's' : ''}`;
  if (weeks < 4) return `${weeks} semaine${weeks > 1 ? 's' : ''}`;
  if (months < 12) return `${months} mois`;
  const years = Math.floor(months / 12);
  return `${years} an${years > 1 ? 's' : ''}`;
}

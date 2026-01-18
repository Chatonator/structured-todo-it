/**
 * Utilitaires de formatage centralisés
 * Utilisés par toutes les vues pour assurer une cohérence
 */

import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday } from 'date-fns';
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

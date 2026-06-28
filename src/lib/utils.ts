import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function timeAgo(date: string | Date): string {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

export function translateActivity(rawText: string): string {
  const rules: [RegExp, string][] = [
    [/\bfix(ed|es|ing)?\b/gi, 'resolved issue in'],
    [/\badd(ed|s|ing)?\b/gi, 'implemented'],
    [/\bupdate(d|s|ing)?\s+ui\b/gi, 'improved interface for'],
    [/\brefactor(ed|s|ing)?\b/gi, 'optimized system for performance in'],
    [/\bdeploy(ed|s|ing)?\b/gi, 'published update to'],
    [/\bremove(d|s|ing)?\b/gi, 'cleaned up'],
  ]
  let result = rawText
  for (const [pattern, replacement] of rules) {
    result = result.replace(pattern, replacement)
  }
  return result.charAt(0).toUpperCase() + result.slice(1)
}

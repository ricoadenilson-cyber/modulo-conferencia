import { FIXED_PRODUCTS } from '../constants';
import { ItemEntryState } from '../types';
import { calculateItemTotals, formatTodayDisplay } from './formatters';

export function generateSummaryText(items: Record<string, ItemEntryState>): string {
  const dateStr = formatTodayDisplay();
  const lines: string[] = [`Conferência ${dateStr} (em fardos)`];

  let grandTotal = 0;

  for (const product of FIXED_PRODUCTS) {
    const item = items[product.code];
    const totals = item ? calculateItemTotals(item) : {
      estoqueFardos: 0,
      entradaFardos: 0,
      saidaFardos: 0,
      avariaFardos: 0,
      totalFardos: 0,
    };

    grandTotal += totals.totalFardos;

    // Determine latest HH:MM for item
    let ult = '--:--';
    if (item?.lastUpdatedAt) {
      const parts = item.lastUpdatedAt.split(' ');
      if (parts[1]) {
        ult = parts[1];
      }
    }

    lines.push(
      `${product.code} ${product.description} | Est ${totals.estoqueFardos} | E ${totals.entradaFardos} | S ${totals.saidaFardos} | Av ${totals.avariaFardos} | Total ${totals.totalFardos} | Últ. ${ult}`
    );
  }

  lines.push(`TOTAL GERAL: ${grandTotal}`);

  return lines.join('\n');
}

export async function copyToClipboard(text: string): Promise<boolean> {
  // Try modern navigator.clipboard
  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fallback
    }
  }

  // Fallback using textarea + execCommand
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '-9999px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);
    return successful;
  } catch {
    return false;
  }
}

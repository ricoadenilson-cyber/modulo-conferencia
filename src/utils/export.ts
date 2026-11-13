import ExcelJS from 'exceljs';
import type { FixedProduct, MovementType, ProductItemState } from '../types/inventory';
import {
  calcBales,
  computeItemTotals,
  formatDateBR,
  formatDateTimeBR,
  formatNumberBR,
  formatTimeBR,
  getMovementLabel,
  getTodayKey,
} from './formatters';

export function buildCopySummary(
  products: FixedProduct[],
  items: Record<string, ProductItemState>,
): string {
  const todayStr = formatDateBR(new Date());
  const lines: string[] = [`Conferência ${todayStr} (em fardos)`];

  let grandTotal = 0;

  for (const product of products) {
    const state = items[product.codigo];
    const totals = computeItemTotals(state);
    grandTotal += totals.totalFardos;

    const lastStr = state.lastModifiedAt ? formatTimeBR(state.lastModifiedAt) : '--:--';

    lines.push(
      `${product.codigo} ${product.descricao} | Est ${formatNumberBR(totals.estoqueFardos)} | E ${formatNumberBR(totals.entradasFardos)} (${totals.entradasCount}) | S ${formatNumberBR(totals.saidasFardos)} (${totals.saidasCount}) | Av ${formatNumberBR(totals.avariasFardos)} (${totals.avariasCount}) | Total ${formatNumberBR(totals.totalFardos)} | Últ. ${lastStr}`,
    );
  }

  lines.push(`TOTAL GERAL: ${formatNumberBR(grandTotal)}`);
  return lines.join('\n');
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to textarea fallback
    }
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

const COLOR_NAVY = 'FF1B2A4E';
const COLOR_TEXT = 'FF14213D';
const COLOR_MUTED = 'FF52607A';
const COLOR_BG_SUBHEADER = 'FFF3F5F9';
const COLOR_BG_SECTION = 'FFE7ECF5';
const COLOR_BG_TOTAL = 'FFD8F2E1';
const COLOR_BORDER = 'FFC9D2E3';
const COLOR_ENTRADA = 'FF1E8E4E';
const COLOR_SAIDA = 'FFD33F3F';
const COLOR_AVARIA = 'FFE08A00';
const COLOR_WHITE = 'FFFFFFFF';

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: COLOR_BORDER } },
  left: { style: 'thin', color: { argb: COLOR_BORDER } },
  bottom: { style: 'thin', color: { argb: COLOR_BORDER } },
  right: { style: 'thin', color: { argb: COLOR_BORDER } },
};

function getMovementArgb(tipo: MovementType): string {
  if (tipo === 'entrada') return COLOR_ENTRADA;
  if (tipo === 'saida') return COLOR_SAIDA;
  return COLOR_AVARIA;
}

function applyCellStyle(
  cell: ExcelJS.Cell,
  options: {
    fill?: string;
    fontColor?: string;
    bold?: boolean;
    size?: number;
    horizontal?: 'left' | 'center' | 'right';
    border?: boolean;
    numFmt?: string;
  } = {},
) {
  cell.alignment = {
    horizontal: options.horizontal ?? 'center',
    vertical: 'middle',
    wrapText: false,
  };
  cell.font = {
    name: 'Calibri',
    size: options.size ?? 11,
    bold: options.bold ?? false,
    color: { argb: options.fontColor ?? COLOR_TEXT },
  };
  if (options.fill) {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: options.fill },
    };
  }
  if (options.border !== false) {
    cell.border = THIN_BORDER;
  }
  if (options.numFmt) {
    cell.numFmt = options.numFmt;
  }
}

function styleRange(
  ws: ExcelJS.Worksheet,
  row: number,
  colStart: number,
  colEnd: number,
  options: Parameters<typeof applyCellStyle>[1],
) {
  for (let c = colStart; c <= colEnd; c++) {
    applyCellStyle(ws.getCell(row, c), options);
  }
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportFallbackCsv(
  products: FixedProduct[],
  items: Record<string, ProductItemState>,
  todayKey: string,
) {
  const now = new Date();
  const todayStr = formatDateBR(now);
  const exportedAtStr = formatDateTimeBR(now.getTime());

  let totalEstoque = 0;
  let totalEntradas = 0;
  let totalSaidas = 0;
  let totalAvarias = 0;
  let grandTotal = 0;

  for (const p of products) {
    const t = computeItemTotals(items[p.codigo]);
    totalEstoque += t.estoqueFardos;
    totalEntradas += t.entradasFardos;
    totalSaidas += t.saidasFardos;
    totalAvarias += t.avariasFardos;
    grandTotal += t.totalFardos;
  }

  const rows: string[][] = [
    ['CONFERÊNCIA DE ESTOQUE'],
    [`Data: ${todayStr} • Exportado em: ${exportedAtStr} • Unidade: fardos`],
    [],
    ['RESUMO GERAL'],
    ['Estoque inicial', String(totalEstoque)],
    ['+ Entradas', String(totalEntradas)],
    ['− Saídas', String(totalSaidas)],
    ['Avarias', String(totalAvarias)],
    ['TOTAL GERAL', String(grandTotal)],
  ];

  for (const product of products) {
    const state = items[product.codigo];
    const totals = computeItemTotals(state);
    const orderedMovements = [...state.movimentos].sort((a, b) => a.timestamp - b.timestamp);

    rows.push([]);
    rows.push([
      `${product.codigo} — ${product.descricao}`,
      '',
      '',
      `Fardos/palete: ${totals.fardosPorPalete}`,
    ]);
    rows.push(['', 'Paletes', 'Fardos', '= Fardos', 'Data / hora']);
    rows.push([
      'Estoque',
      String(state.estoque.paletes ?? 0),
      String(state.estoque.fardos ?? 0),
      String(totals.estoqueFardos),
      state.estoque.updatedAt ? formatDateTimeBR(state.estoque.updatedAt) : '—',
    ]);
    rows.push(['MOVIMENTOS DO DIA']);

    if (orderedMovements.length === 0) {
      rows.push(['Nenhum movimento lançado']);
    } else {
      for (const mov of orderedMovements) {
        const movBales = calcBales(mov.paletes, mov.fardos, totals.fardosPorPalete);
        rows.push([
          getMovementLabel(mov.tipo),
          String(mov.paletes),
          String(mov.fardos),
          String(movBales),
          formatDateTimeBR(mov.timestamp),
        ]);
      }
    }

    rows.push([
      'Total Entradas',
      '',
      '',
      String(totals.entradasFardos),
      `${totals.entradasCount} lançamento(s)`,
    ]);
    rows.push([
      'Total Saídas',
      '',
      '',
      String(totals.saidasFardos),
      `${totals.saidasCount} lançamento(s)`,
    ]);
    rows.push([
      'Total Avarias',
      '',
      '',
      String(totals.avariasFardos),
      `${totals.avariasCount} lançamento(s)`,
    ]);
    rows.push([
      'TOTAL (fardos)',
      '',
      '',
      String(totals.totalFardos),
      state.lastModifiedAt ? formatDateTimeBR(state.lastModifiedAt) : 'Sem lançamentos',
    ]);
  }

  const csvContent =
    '\uFEFF' +
    rows
      .map((line) =>
        line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';'),
      )
      .join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, `conferencia_${todayKey}.csv`);
}

export async function exportToExcel(
  products: FixedProduct[],
  items: Record<string, ProductItemState>,
): Promise<'xlsx' | 'csv'> {
  const now = new Date();
  const todayKey = getTodayKey(now);
  const todayStr = formatDateBR(now);
  const exportedAtStr = formatDateTimeBR(now.getTime());

  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Módulo de Conferência';
    workbook.created = now;

    const ws = workbook.addWorksheet('Conferência', {
      views: [{ showGridLines: false }],
      pageSetup: {
        orientation: 'portrait',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
      },
    });

    ws.columns = [
      { width: 18 },
      { width: 11 },
      { width: 11 },
      { width: 13 },
      { width: 20 },
    ];

    let rowIdx = 1;

    // Row 1: Title
    ws.mergeCells(rowIdx, 1, rowIdx, 5);
    ws.getCell(rowIdx, 1).value = 'CONFERÊNCIA DE ESTOQUE';
    ws.getRow(rowIdx).height = 28;
    styleRange(ws, rowIdx, 1, 5, {
      fill: COLOR_NAVY,
      fontColor: COLOR_WHITE,
      bold: true,
      size: 14,
      horizontal: 'center',
    });
    rowIdx++;

    // Row 2: Subtitle
    ws.mergeCells(rowIdx, 1, rowIdx, 5);
    ws.getCell(rowIdx, 1).value =
      `Data: ${todayStr} • Exportado em: ${exportedAtStr} • Unidade: fardos`;
    ws.getRow(rowIdx).height = 22;
    styleRange(ws, rowIdx, 1, 5, {
      fill: COLOR_BG_SUBHEADER,
      fontColor: COLOR_TEXT,
      size: 10,
      horizontal: 'center',
    });
    rowIdx++;

    // Blank row
    ws.getRow(rowIdx).height = 12;
    rowIdx++;

    // Compute overall totals
    let totalEstoque = 0;
    let totalEntradas = 0;
    let totalSaidas = 0;
    let totalAvarias = 0;
    let grandTotal = 0;

    for (const p of products) {
      const t = computeItemTotals(items[p.codigo]);
      totalEstoque += t.estoqueFardos;
      totalEntradas += t.entradasFardos;
      totalSaidas += t.saidasFardos;
      totalAvarias += t.avariasFardos;
      grandTotal += t.totalFardos;
    }

    // RESUMO GERAL header
    ws.mergeCells(rowIdx, 1, rowIdx, 5);
    ws.getCell(rowIdx, 1).value = 'RESUMO GERAL';
    ws.getRow(rowIdx).height = 24;
    styleRange(ws, rowIdx, 1, 5, {
      fill: COLOR_NAVY,
      fontColor: COLOR_WHITE,
      bold: true,
      size: 11,
      horizontal: 'center',
    });
    rowIdx++;

    const summaryRows: Array<{
      label: string;
      value: number;
      fontColor?: string;
      fill?: string;
      bold?: boolean;
    }> = [
      { label: 'Estoque inicial', value: totalEstoque },
      { label: '+ Entradas', value: totalEntradas, fontColor: COLOR_ENTRADA, bold: true },
      { label: '− Saídas', value: totalSaidas, fontColor: COLOR_SAIDA, bold: true },
      { label: 'Avarias', value: totalAvarias, fontColor: COLOR_AVARIA, bold: true },
      {
        label: 'TOTAL GERAL',
        value: grandTotal,
        fill: COLOR_BG_TOTAL,
        bold: true,
      },
    ];

    for (const sRow of summaryRows) {
      ws.mergeCells(rowIdx, 1, rowIdx, 3);
      ws.mergeCells(rowIdx, 4, rowIdx, 5);
      ws.getCell(rowIdx, 1).value = sRow.label;
      ws.getCell(rowIdx, 4).value = sRow.value;
      ws.getRow(rowIdx).height = 21;

      styleRange(ws, rowIdx, 1, 3, {
        fill: sRow.fill,
        fontColor: sRow.fontColor ?? COLOR_TEXT,
        bold: sRow.bold ?? false,
        horizontal: 'center',
      });
      styleRange(ws, rowIdx, 4, 5, {
        fill: sRow.fill,
        fontColor: COLOR_TEXT,
        bold: sRow.bold ?? false,
        horizontal: 'center',
        numFmt: '#,##0',
      });
      rowIdx++;
    }

    // Product blocks
    for (const product of products) {
      const state = items[product.codigo];
      const totals = computeItemTotals(state);
      const orderedMovements = [...state.movimentos].sort(
        (a, b) => a.timestamp - b.timestamp,
      );

      // Blank separator row
      ws.getRow(rowIdx).height = 12;
      rowIdx++;

      // Item Title Row: A:C merged + D:E merged
      ws.mergeCells(rowIdx, 1, rowIdx, 3);
      ws.mergeCells(rowIdx, 4, rowIdx, 5);
      ws.getCell(rowIdx, 1).value = `${product.codigo} — ${product.descricao}`;
      ws.getCell(rowIdx, 4).value = `Fardos/palete: ${totals.fardosPorPalete}`;
      ws.getRow(rowIdx).height = 24;
      styleRange(ws, rowIdx, 1, 5, {
        fill: COLOR_NAVY,
        fontColor: COLOR_WHITE,
        bold: true,
        size: 11,
        horizontal: 'center',
      });
      rowIdx++;

      // Column headers
      ws.getCell(rowIdx, 1).value = '';
      ws.getCell(rowIdx, 2).value = 'Paletes';
      ws.getCell(rowIdx, 3).value = 'Fardos';
      ws.getCell(rowIdx, 4).value = '= Fardos';
      ws.getCell(rowIdx, 5).value = 'Data / hora';
      ws.getRow(rowIdx).height = 20;
      styleRange(ws, rowIdx, 1, 5, {
        fill: COLOR_BG_SECTION,
        bold: true,
        size: 10,
        horizontal: 'center',
      });
      rowIdx++;

      // Stock row
      ws.getCell(rowIdx, 1).value = 'Estoque';
      ws.getCell(rowIdx, 2).value = state.estoque.paletes ?? 0;
      ws.getCell(rowIdx, 3).value = state.estoque.fardos ?? 0;
      ws.getCell(rowIdx, 4).value = totals.estoqueFardos;
      ws.getCell(rowIdx, 5).value = state.estoque.updatedAt
        ? formatDateTimeBR(state.estoque.updatedAt)
        : '—';
      ws.getRow(rowIdx).height = 20;
      applyCellStyle(ws.getCell(rowIdx, 1), { horizontal: 'center' });
      applyCellStyle(ws.getCell(rowIdx, 2), { numFmt: '#,##0' });
      applyCellStyle(ws.getCell(rowIdx, 3), { numFmt: '#,##0' });
      applyCellStyle(ws.getCell(rowIdx, 4), { bold: true, numFmt: '#,##0' });
      applyCellStyle(ws.getCell(rowIdx, 5), {
        fontColor: state.estoque.updatedAt ? COLOR_TEXT : COLOR_MUTED,
        size: 10,
      });
      rowIdx++;

      // MOVIMENTOS DO DIA header
      ws.mergeCells(rowIdx, 1, rowIdx, 5);
      ws.getCell(rowIdx, 1).value = 'MOVIMENTOS DO DIA';
      ws.getRow(rowIdx).height = 20;
      styleRange(ws, rowIdx, 1, 5, {
        fill: COLOR_BG_SECTION,
        bold: true,
        size: 10,
        horizontal: 'left',
      });
      rowIdx++;

      // Movement rows (chronological order)
      if (orderedMovements.length === 0) {
        ws.mergeCells(rowIdx, 1, rowIdx, 5);
        ws.getCell(rowIdx, 1).value = 'Nenhum movimento lançado';
        ws.getRow(rowIdx).height = 20;
        styleRange(ws, rowIdx, 1, 5, {
          fontColor: COLOR_MUTED,
          size: 10,
          horizontal: 'center',
        });
        rowIdx++;
      } else {
        for (const mov of orderedMovements) {
          const movBales = calcBales(mov.paletes, mov.fardos, totals.fardosPorPalete);
          ws.getCell(rowIdx, 1).value = getMovementLabel(mov.tipo);
          ws.getCell(rowIdx, 2).value = mov.paletes;
          ws.getCell(rowIdx, 3).value = mov.fardos;
          ws.getCell(rowIdx, 4).value = movBales;
          ws.getCell(rowIdx, 5).value = formatDateTimeBR(mov.timestamp);
          ws.getRow(rowIdx).height = 20;

          applyCellStyle(ws.getCell(rowIdx, 1), {
            bold: true,
            fontColor: getMovementArgb(mov.tipo),
            horizontal: 'left',
          });
          applyCellStyle(ws.getCell(rowIdx, 2), { numFmt: '#,##0' });
          applyCellStyle(ws.getCell(rowIdx, 3), { numFmt: '#,##0' });
          applyCellStyle(ws.getCell(rowIdx, 4), { bold: true, numFmt: '#,##0' });
          applyCellStyle(ws.getCell(rowIdx, 5), { size: 10 });
          rowIdx++;
        }
      }

      // 3 Type total rows
      const typeTotals: Array<{
        label: string;
        value: number;
        count: number;
        color: string;
      }> = [
        {
          label: 'Total Entradas',
          value: totals.entradasFardos,
          count: totals.entradasCount,
          color: COLOR_ENTRADA,
        },
        {
          label: 'Total Saídas',
          value: totals.saidasFardos,
          count: totals.saidasCount,
          color: COLOR_SAIDA,
        },
        {
          label: 'Total Avarias',
          value: totals.avariasFardos,
          count: totals.avariasCount,
          color: COLOR_AVARIA,
        },
      ];

      for (const tt of typeTotals) {
        ws.mergeCells(rowIdx, 1, rowIdx, 3);
        ws.getCell(rowIdx, 1).value = tt.label;
        ws.getCell(rowIdx, 4).value = tt.value;
        ws.getCell(rowIdx, 5).value = `${tt.count} lançamento(s)`;
        ws.getRow(rowIdx).height = 20;

        styleRange(ws, rowIdx, 1, 3, {
          fill: COLOR_BG_SECTION,
          fontColor: tt.color,
          bold: true,
          horizontal: 'center',
        });
        applyCellStyle(ws.getCell(rowIdx, 4), {
          fill: COLOR_BG_SECTION,
          bold: true,
          numFmt: '#,##0',
        });
        applyCellStyle(ws.getCell(rowIdx, 5), {
          fill: COLOR_BG_SECTION,
          fontColor: COLOR_MUTED,
          size: 10,
        });
        rowIdx++;
      }

      // Final item total row
      ws.mergeCells(rowIdx, 1, rowIdx, 3);
      ws.getCell(rowIdx, 1).value = 'TOTAL (fardos)';
      ws.getCell(rowIdx, 4).value = totals.totalFardos;
      ws.getCell(rowIdx, 5).value = state.lastModifiedAt
        ? formatDateTimeBR(state.lastModifiedAt)
        : 'Sem lançamentos';
      ws.getRow(rowIdx).height = 24;

      styleRange(ws, rowIdx, 1, 3, {
        fill: COLOR_BG_TOTAL,
        bold: true,
        horizontal: 'center',
      });
      applyCellStyle(ws.getCell(rowIdx, 4), {
        fill: COLOR_BG_TOTAL,
        bold: true,
        size: 13,
        numFmt: '#,##0',
      });
      applyCellStyle(ws.getCell(rowIdx, 5), {
        fill: COLOR_BG_TOTAL,
        fontColor: state.lastModifiedAt ? COLOR_TEXT : COLOR_MUTED,
        size: 10,
      });
      rowIdx++;
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    triggerDownload(blob, `conferencia_${todayKey}.xlsx`);
    return 'xlsx';
  } catch {
    exportFallbackCsv(products, items, todayKey);
    return 'csv';
  }
}

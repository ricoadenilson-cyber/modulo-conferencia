import ExcelJS from 'exceljs';
import { FIXED_PRODUCTS } from '../constants';
import { ItemEntryState } from '../types';
import {
  calculateItemTotals,
  formatNumberBR,
  formatTodayDisplay,
  getCurrentDateTimeFormatted,
  getTodayDateString,
} from './formatters';

const COLOR_NAVY = 'FF1B2A4E';
const COLOR_WHITE = 'FFFFFFFF';
const COLOR_GRAY_BG = 'FFF3F5F9';
const COLOR_HEADER_BG = 'FFE7ECF5';
const COLOR_TOTAL_BG = 'FFD8F2E1';
const COLOR_BORDER = 'FFC9D2E3';

const COLOR_ESTOQUE = 'FF1B2A4E';
const COLOR_ENTRADA = 'FF1E8E4E';
const COLOR_SAIDA = 'FFD33F3F';
const COLOR_AVARIA = 'FFE08A00';

const thinBorder: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: COLOR_BORDER } },
  left: { style: 'thin', color: { argb: COLOR_BORDER } },
  bottom: { style: 'thin', color: { argb: COLOR_BORDER } },
  right: { style: 'thin', color: { argb: COLOR_BORDER } },
};

function applyBorderToRange(
  worksheet: ExcelJS.Worksheet,
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number
) {
  for (let r = startRow; r <= endRow; r++) {
    for (let c = startCol; c <= endCol; c++) {
      const cell = worksheet.getCell(r, c);
      cell.border = thinBorder;
    }
  }
}

export async function exportToExcel(items: Record<string, ItemEntryState>): Promise<void> {
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Módulo de Conferência';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Conferência', {
      views: [{ showGridLines: false }],
      pageSetup: {
        orientation: 'portrait',
        fitToWidth: 1,
        fitToHeight: 0,
      },
    });

    // 5 colunas (larguras 18, 11, 11, 13, 20)
    worksheet.columns = [
      { width: 18 },
      { width: 11 },
      { width: 11 },
      { width: 13 },
      { width: 20 },
    ];

    const todayStr = formatTodayDisplay();
    const exportTimeStr = getCurrentDateTimeFormatted();

    // Linha 1: "CONFERÊNCIA DE ESTOQUE"
    worksheet.mergeCells('A1:E1');
    const cellA1 = worksheet.getCell('A1');
    cellA1.value = 'CONFERÊNCIA DE ESTOQUE';
    cellA1.font = { name: 'Calibri', size: 14, bold: true, color: { argb: COLOR_WHITE } };
    cellA1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_NAVY } };
    cellA1.alignment = { vertical: 'middle', horizontal: 'center' };
    applyBorderToRange(worksheet, 1, 1, 1, 5);
    worksheet.getRow(1).height = 26;

    // Linha 2: "Data: dd/mm/aaaa • Exportado em: dd/mm/aaaa hh:mm • Unidade: fardos"
    worksheet.mergeCells('A2:E2');
    const cellA2 = worksheet.getCell('A2');
    cellA2.value = `Data: ${todayStr} • Exportado em: ${exportTimeStr} • Unidade: fardos`;
    cellA2.font = { name: 'Calibri', size: 10, italic: false };
    cellA2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_GRAY_BG } };
    cellA2.alignment = { vertical: 'middle', horizontal: 'center' };
    applyBorderToRange(worksheet, 2, 1, 2, 5);
    worksheet.getRow(2).height = 20;

    // Linha 3: em branco
    let currentRow = 4;

    // Calcular somas gerais
    let grandEstoque = 0;
    let grandEntrada = 0;
    let grandSaida = 0;
    let grandAvaria = 0;
    let grandTotal = 0;

    for (const prod of FIXED_PRODUCTS) {
      const it = items[prod.code];
      if (it) {
        const tot = calculateItemTotals(it);
        grandEstoque += tot.estoqueFardos;
        grandEntrada += tot.entradaFardos;
        grandSaida += tot.saidaFardos;
        grandAvaria += tot.avariaFardos;
        grandTotal += tot.totalFardos;
      }
    }

    // Bloco RESUMO GERAL
    worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
    const cellResumoHeader = worksheet.getCell(`A${currentRow}`);
    cellResumoHeader.value = 'RESUMO GERAL';
    cellResumoHeader.font = { name: 'Calibri', size: 12, bold: true, color: { argb: COLOR_WHITE } };
    cellResumoHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_NAVY } };
    cellResumoHeader.alignment = { vertical: 'middle', horizontal: 'center' };
    applyBorderToRange(worksheet, currentRow, 1, currentRow, 5);
    worksheet.getRow(currentRow).height = 22;
    currentRow++;

    // 5 linhas do Resumo Geral
    const resumoRows = [
      { label: 'Estoque inicial', val: grandEstoque, color: COLOR_ESTOQUE, isTotal: false },
      { label: '+ Entradas', val: grandEntrada, color: COLOR_ENTRADA, isTotal: false },
      { label: '− Saídas', val: grandSaida, color: COLOR_SAIDA, isTotal: false },
      { label: 'Avarias', val: grandAvaria, color: COLOR_AVARIA, isTotal: false },
      { label: 'TOTAL GERAL', val: grandTotal, color: COLOR_NAVY, isTotal: true },
    ];

    for (const rData of resumoRows) {
      worksheet.mergeCells(`A${currentRow}:C${currentRow}`);
      worksheet.mergeCells(`D${currentRow}:E${currentRow}`);

      const lblCell = worksheet.getCell(`A${currentRow}`);
      lblCell.value = rData.label;
      lblCell.font = {
        name: 'Calibri',
        size: rData.isTotal ? 11 : 10,
        bold: true,
        color: { argb: rData.color },
      };
      lblCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

      const valCell = worksheet.getCell(`D${currentRow}`);
      valCell.value = `${formatNumberBR(rData.val)} fardos`;
      valCell.font = {
        name: 'Calibri',
        size: rData.isTotal ? 12 : 10,
        bold: true,
        color: { argb: rData.color },
      };
      valCell.alignment = { vertical: 'middle', horizontal: 'center' };

      if (rData.isTotal) {
        lblCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_TOTAL_BG } };
        valCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_TOTAL_BG } };
      }

      applyBorderToRange(worksheet, currentRow, 1, currentRow, 5);
      worksheet.getRow(currentRow).height = 20;
      currentRow++;
    }

    // Linha em branco
    currentRow++;

    // Um bloco por item
    for (const product of FIXED_PRODUCTS) {
      const it = items[product.code];
      const tot = it ? calculateItemTotals(it) : {
        estoqueFardos: 0,
        entradaFardos: 0,
        saidaFardos: 0,
        avariaFardos: 0,
        totalFardos: 0,
      };

      const fpp = it ? it.fardosPerPallet : product.defaultFardosPerPallet;

      // Linha de título: A:C "CÓDIGO — DESCRIÇÃO" e D:E "Fardos/palete: N"
      worksheet.mergeCells(`A${currentRow}:C${currentRow}`);
      worksheet.mergeCells(`D${currentRow}:E${currentRow}`);

      const titleCell = worksheet.getCell(`A${currentRow}`);
      titleCell.value = `${product.code} — ${product.description}`;
      titleCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: COLOR_WHITE } };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_NAVY } };
      titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

      const fppCell = worksheet.getCell(`D${currentRow}`);
      fppCell.value = `Fardos/palete: ${fpp}`;
      fppCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: COLOR_WHITE } };
      fppCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_NAVY } };
      fppCell.alignment = { vertical: 'middle', horizontal: 'center' };

      applyBorderToRange(worksheet, currentRow, 1, currentRow, 5);
      worksheet.getRow(currentRow).height = 22;
      currentRow++;

      // Linha de cabeçalho da grade
      const colHeaders = ['', 'Paletes', 'Fardos', '= Fardos', 'Última alteração'];
      for (let c = 1; c <= 5; c++) {
        const cell = worksheet.getCell(currentRow, c);
        cell.value = colHeaders[c - 1];
        cell.font = { name: 'Calibri', size: 10, bold: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_HEADER_BG } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = thinBorder;
      }
      worksheet.getRow(currentRow).height = 20;
      currentRow++;

      // 4 linhas: Estoque, + Entrada, − Saída, Avaria
      const linesConfig = [
        {
          label: 'Estoque',
          color: COLOR_ESTOQUE,
          data: it?.estoque,
          fardosCalc: tot.estoqueFardos,
        },
        {
          label: '+ Entrada',
          color: COLOR_ENTRADA,
          data: it?.entrada,
          fardosCalc: tot.entradaFardos,
        },
        {
          label: '− Saída',
          color: COLOR_SAIDA,
          data: it?.saida,
          fardosCalc: tot.saidaFardos,
        },
        {
          label: 'Avaria',
          color: COLOR_AVARIA,
          data: it?.avaria,
          fardosCalc: tot.avariaFardos,
        },
      ];

      for (const line of linesConfig) {
        const pVal = line.data?.paletes === '' ? 0 : Number(line.data?.paletes || 0);
        const fVal = line.data?.fardos === '' ? 0 : Number(line.data?.fardos || 0);
        const dateVal = line.data?.updatedAtFull || '—';

        // Col 1: Rótulo
        const c1 = worksheet.getCell(currentRow, 1);
        c1.value = line.label;
        c1.font = { name: 'Calibri', size: 10, bold: true, color: { argb: line.color } };
        c1.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
        c1.border = thinBorder;

        // Col 2: Paletes
        const c2 = worksheet.getCell(currentRow, 2);
        c2.value = pVal;
        c2.font = { name: 'Calibri', size: 10 };
        c2.alignment = { vertical: 'middle', horizontal: 'center' };
        c2.border = thinBorder;

        // Col 3: Fardos
        const c3 = worksheet.getCell(currentRow, 3);
        c3.value = fVal;
        c3.font = { name: 'Calibri', size: 10 };
        c3.alignment = { vertical: 'middle', horizontal: 'center' };
        c3.border = thinBorder;

        // Col 4: = Fardos
        const c4 = worksheet.getCell(currentRow, 4);
        c4.value = line.fardosCalc;
        c4.font = { name: 'Calibri', size: 10, bold: true };
        c4.alignment = { vertical: 'middle', horizontal: 'center' };
        c4.border = thinBorder;

        // Col 5: Data/hora
        const c5 = worksheet.getCell(currentRow, 5);
        c5.value = dateVal;
        c5.font = { name: 'Calibri', size: 9 };
        c5.alignment = { vertical: 'middle', horizontal: 'center' };
        c5.border = thinBorder;

        worksheet.getRow(currentRow).height = 19;
        currentRow++;
      }

      // Linha final do item: A:C "TOTAL (fardos)", D = total do item, E = data/hora
      worksheet.mergeCells(`A${currentRow}:C${currentRow}`);
      const totLbl = worksheet.getCell(`A${currentRow}`);
      totLbl.value = 'TOTAL (fardos)';
      totLbl.font = { name: 'Calibri', size: 11, bold: true };
      totLbl.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_TOTAL_BG } };
      totLbl.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

      const totVal = worksheet.getCell(`D${currentRow}`);
      totVal.value = tot.totalFardos;
      totVal.font = { name: 'Calibri', size: 13, bold: true };
      totVal.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_TOTAL_BG } };
      totVal.alignment = { vertical: 'middle', horizontal: 'center' };

      const totDate = worksheet.getCell(`E${currentRow}`);
      totDate.value = it?.lastUpdatedAt || 'Sem lançamentos';
      totDate.font = { name: 'Calibri', size: 9 };
      totDate.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_TOTAL_BG } };
      totDate.alignment = { vertical: 'middle', horizontal: 'center' };

      applyBorderToRange(worksheet, currentRow, 1, currentRow, 5);
      worksheet.getRow(currentRow).height = 22;
      currentRow++;

      // Linha em branco entre itens
      currentRow++;
    }

    // Gerar buffer e download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const filename = `conferencia_${getTodayDateString()}.xlsx`;
    downloadBlob(blob, filename);
  } catch (error) {
    console.error('Erro ao gerar Excel via ExcelJS, gerando CSV de fallback:', error);
    exportToCsvFallback(items);
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => window.URL.revokeObjectURL(url), 1000);
}

function exportToCsvFallback(items: Record<string, ItemEntryState>): void {
  const todayStr = formatTodayDisplay();
  const exportTimeStr = getCurrentDateTimeFormatted();
  const rows: string[][] = [];

  rows.push(['CONFERÊNCIA DE ESTOQUE', '', '', '', '']);
  rows.push([`Data: ${todayStr} • Exportado em: ${exportTimeStr} • Unidade: fardos`, '', '', '', '']);
  rows.push([]);

  // Resumo
  let grandEstoque = 0;
  let grandEntrada = 0;
  let grandSaida = 0;
  let grandAvaria = 0;
  let grandTotal = 0;

  for (const prod of FIXED_PRODUCTS) {
    const it = items[prod.code];
    if (it) {
      const tot = calculateItemTotals(it);
      grandEstoque += tot.estoqueFardos;
      grandEntrada += tot.entradaFardos;
      grandSaida += tot.saidaFardos;
      grandAvaria += tot.avariaFardos;
      grandTotal += tot.totalFardos;
    }
  }

  rows.push(['RESUMO GERAL', '', '', '', '']);
  rows.push(['Estoque inicial', '', '', `${grandEstoque} fardos`, '']);
  rows.push(['+ Entradas', '', '', `${grandEntrada} fardos`, '']);
  rows.push(['− Saídas', '', '', `${grandSaida} fardos`, '']);
  rows.push(['Avarias', '', '', `${grandAvaria} fardos`, '']);
  rows.push(['TOTAL GERAL', '', '', `${grandTotal} fardos`, '']);
  rows.push([]);

  for (const product of FIXED_PRODUCTS) {
    const it = items[product.code];
    const tot = it ? calculateItemTotals(it) : {
      estoqueFardos: 0,
      entradaFardos: 0,
      saidaFardos: 0,
      avariaFardos: 0,
      totalFardos: 0,
    };
    const fpp = it ? it.fardosPerPallet : product.defaultFardosPerPallet;

    rows.push([`${product.code} — ${product.description}`, '', '', `Fardos/palete: ${fpp}`, '']);
    rows.push(['Tipo', 'Paletes', 'Fardos', '= Fardos', 'Última alteração']);

    const lines = [
      { label: 'Estoque', data: it?.estoque, calc: tot.estoqueFardos },
      { label: '+ Entrada', data: it?.entrada, calc: tot.entradaFardos },
      { label: '− Saída', data: it?.saida, calc: tot.saidaFardos },
      { label: 'Avaria', data: it?.avaria, calc: tot.avariaFardos },
    ];

    for (const l of lines) {
      rows.push([
        l.label,
        String(l.data?.paletes === '' ? 0 : l.data?.paletes || 0),
        String(l.data?.fardos === '' ? 0 : l.data?.fardos || 0),
        String(l.calc),
        l.data?.updatedAtFull || '—',
      ]);
    }

    rows.push(['TOTAL (fardos)', '', '', String(tot.totalFardos), it?.lastUpdatedAt || 'Sem lançamentos']);
    rows.push([]);
  }

  const csvContent = '\uFEFF' + rows.map((r) => r.map((c) => `"${(c || '').replace(/"/g, '""')}"`).join(';')).join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `conferencia_${getTodayDateString()}.csv`);
}

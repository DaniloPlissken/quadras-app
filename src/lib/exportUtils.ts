import ExcelJS from 'exceljs';

export type QuadraExport = {
  id: string
  nome: string
  modalidade: { id: string; nome: string }
}

export type AgendaExport = {
  id: string
  data: string
  quadraId: string
  horarios: string[]
}

export type ReservaExport = {
  id: string
  data: string
  slot: string
  status: string
  quadraId: string
  user?: { id: string; name: string; email: string; telefone?: string } | null
  operador?: { name: string } | null
  time?: {
    id: string
    nome: string
    responsaveis: { pessoa: { nome: string; cpf: string; telefone: string } }[]
  }
}

export type ExportRow = {
  Data: string;
  DiaSemana: string;
  Horario: string;
  Quadra: string;
  Modalidade: string;
  Status: string;
  Tipo: string;
  ClienteTime: string;
  CPF: string;
  Telefone: string;
}

// Utilitário local de datas para a exportação
function formatDataLocalBr(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0')
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const y = date.getFullYear()
  return `${d}/${m}/${y}`
}

function formatDiaSemana(date: Date): string {
  const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  return dias[date.getDay()]
}

function formatDiaCurtoComData(date: Date): string {
  const dias = ['dom.', 'seg.', 'ter.', 'qua.', 'qui.', 'sex.', 'sáb.']
  const d = String(date.getDate()).padStart(2, '0')
  const m = String(date.getMonth() + 1)
  return `${dias[date.getDay()]} ${d}/${m}`
}

// O CSV continua com o padrão de lista/dados
export function prepareExportData(
  weekDays: Date[],
  allSlots: string[],
  quadrasFiltradas: QuadraExport[],
  agendasMap: Map<string, AgendaExport>,
  reservasMap: Map<string, ReservaExport>
): ExportRow[] {
  const rows: ExportRow[] = [];

  for (const day of weekDays) {
    const dataStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
    const dataFormatada = formatDataLocalBr(day);
    const diaSemana = formatDiaSemana(day);

    for (const quadra of quadrasFiltradas) {
      const agenda = agendasMap.get(`${dataStr}-${quadra.id}`);
      
      for (const slot of allSlots) {
        const reserva = reservasMap.get(`${dataStr}-${slot}-${quadra.id}`);
        const isAberto = agenda?.horarios.includes(slot);

        // Se não tem reserva, ignoramos. O relatório deve conter apenas horários reservados.
        if (!reserva) {
           continue;
        }

        const status = 'Reservado';
        let tipo = '';
        let clienteTime = '';
        let cpf = '';
        let telefone = '';

        if (reserva.time && reserva.time.responsaveis && reserva.time.responsaveis.length > 0) {
          tipo = 'Time';
          clienteTime = reserva.time.nome.toUpperCase();
          const resp = reserva.time.responsaveis[0].pessoa;
          cpf = resp.cpf;
          telefone = resp.telefone || '';
        } else if (reserva.user) {
          tipo = 'Pessoal';
          clienteTime = reserva.user.name.toUpperCase();
          cpf = reserva.user.id.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
          telefone = reserva.user.telefone || '';
        } else {
          tipo = 'Admin';
          clienteTime = reserva.operador?.name ? `Operador: ${reserva.operador.name.toUpperCase()}` : 'N/A';
          cpf = '';
          telefone = '';
        }

        rows.push({
          Data: dataFormatada,
          DiaSemana: diaSemana,
          Horario: slot,
          Quadra: quadra.nome.toUpperCase(),
          Modalidade: quadra.modalidade.nome.toUpperCase(),
          Status: status,
          Tipo: tipo,
          ClienteTime: clienteTime,
          CPF: cpf,
          Telefone: telefone,
        });
      }
    }
  }

  return rows;
}

export function downloadCSV(data: ExportRow[], filename: string) {
  if (data.length === 0) {
    alert('Não há dados para exportar.');
    return;
  }

  const headers = Object.keys(data[0]) as (keyof ExportRow)[];
  const csvRows = [];
  
  // Cabeçalhos
  csvRows.push(headers.join(';'));
  
  // Linhas
  for (const row of data) {
    const values = headers.map(header => {
      let val = row[header] ? String(row[header]) : '';
      val = val.replace(/"/g, '""');
      return `"${val}"`;
    });
    csvRows.push(values.join(';'));
  }

  const csvString = csvRows.join('\n');
  const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// O Excel é gerado no formato Matriz Visual espelhando a UI
export async function downloadExcel(
  weekDays: Date[],
  allSlots: string[],
  quadrasFiltradas: QuadraExport[],
  agendasMap: Map<string, AgendaExport>,
  reservasMap: Map<string, ReservaExport>,
  filename: string
) {
  if (weekDays.length === 0 || quadrasFiltradas.length === 0 || allSlots.length === 0) {
    alert('Não há dias, quadras ou horários para exportar.');
    return;
  }

  // Ordenar quadras por Modalidade para agrupar as colunas corretamente
  const quadrasOrdenadas = [...quadrasFiltradas].sort((a, b) => {
    if (a.modalidade.nome !== b.modalidade.nome) return a.modalidade.nome.localeCompare(b.modalidade.nome);
    return a.nome.localeCompare(b.nome);
  });

  // Mapear apenas colunas que possuem alguma reserva (Dia + Quadra)
  type ActiveColumn = { day: Date; quadra: QuadraExport; dataStr: string; };
  const activeColumns: ActiveColumn[] = [];

  for (const day of weekDays) {
    const dataStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
    for (const quadra of quadrasOrdenadas) {
      const hasReserva = allSlots.some(slot => reservasMap.has(`${dataStr}-${slot}-${quadra.id}`));
      if (hasReserva) {
        activeColumns.push({ day, quadra, dataStr });
      }
    }
  }

  if (activeColumns.length === 0) {
    alert('Não há nenhuma reserva no período selecionado.');
    return;
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Agenda Visual');

  // Congela as 4 primeiras linhas e a primeira coluna (Horários)
  worksheet.views = [{ state: 'frozen', xSplit: 1, ySplit: 4 }];

  const lastColIndex = 1 + activeColumns.length;

  // Linha 1: Título Geral
  const firstDay = weekDays[0];
  const lastDay = weekDays[weekDays.length - 1];
  const formatShort = (d: Date) => `${String(d.getDate()).padStart(2, '0')} ${['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'][d.getMonth()]}`;
  const datesTitle = weekDays.length > 1 ? `${formatShort(firstDay)} a ${formatShort(lastDay)}` : formatShort(firstDay);
  
  worksheet.mergeCells(1, 1, 1, lastColIndex);
  const titleCell = worksheet.getCell(1, 1);
  titleCell.value = `RELATÓRIO SEMANAL ${datesTitle}`.toUpperCase();
  titleCell.font = { bold: true, size: 14 };
  titleCell.alignment = { vertical: 'middle', horizontal: 'left' };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFEEEEEE' }
  };

  // Linha 2: Cabeçalho de Dias
  let currentCol = 2;
  let currentDay = activeColumns[0].day;
  let startColDay = 2;
  for (let i = 0; i <= activeColumns.length; i++) {
    const colDef = activeColumns[i];
    if (i === activeColumns.length || colDef.day !== currentDay) {
      if (currentCol - 1 > startColDay) {
        worksheet.mergeCells(2, startColDay, 2, currentCol - 1);
      }
      const cell = worksheet.getCell(2, startColDay);
      cell.value = formatDiaCurtoComData(currentDay).toUpperCase();
      cell.font = { bold: true };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDDDDDD' } };
      
      if (i < activeColumns.length) {
        currentDay = colDef.day;
        startColDay = currentCol;
      }
    }
    if (i < activeColumns.length) currentCol++;
  }

  // Linha 3: Cabeçalho de Modalidades
  currentCol = 2;
  let currentMod = activeColumns[0].quadra.modalidade.nome;
  let currentDayForMod = activeColumns[0].day;
  let startColMod = 2;

  for (let i = 0; i <= activeColumns.length; i++) {
    const colDef = activeColumns[i];
    if (i === activeColumns.length || colDef.day !== currentDayForMod || colDef.quadra.modalidade.nome !== currentMod) {
      if (currentCol - 1 > startColMod) {
        worksheet.mergeCells(3, startColMod, 3, currentCol - 1);
      }
      const cell = worksheet.getCell(3, startColMod);
      cell.value = currentMod.toUpperCase();
      cell.font = { bold: true };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };

      if (i < activeColumns.length) {
        currentMod = colDef.quadra.modalidade.nome;
        currentDayForMod = colDef.day;
        startColMod = currentCol;
      }
    }
    if (i < activeColumns.length) currentCol++;
  }

  // Linha 4: Horário (A) e Cabeçalho de Quadras
  const headerTimeCell = worksheet.getCell(4, 1);
  headerTimeCell.value = 'Horário';
  headerTimeCell.font = { bold: true };
  headerTimeCell.alignment = { vertical: 'middle', horizontal: 'center' };

  currentCol = 2;
  for (const colDef of activeColumns) {
    const cell = worksheet.getCell(4, currentCol);
    cell.value = colDef.quadra.nome.toUpperCase();
    cell.font = { bold: true };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = { bottom: { style: 'thin', color: { argb: 'FFAAAAAA' } } };
    currentCol++;
  }

  // Descobre quais slots realmente possuem reservas
  const slotsComReserva = allSlots.filter(slot => {
    return activeColumns.some(colDef => reservasMap.has(`${colDef.dataStr}-${slot}-${colDef.quadra.id}`));
  });

  // Linhas de Dados (Slots com reserva)
  let currentRow = 5;
  for (const slot of slotsComReserva) {
    const row = worksheet.getRow(currentRow);
    row.height = 80;

    // Célula do Horário
    const timeCell = row.getCell(1);
    timeCell.value = slot;
    timeCell.alignment = { vertical: 'top', horizontal: 'center' };
    timeCell.font = { bold: true };

    currentCol = 2;
    for (const colDef of activeColumns) {
      const reserva = reservasMap.get(`${colDef.dataStr}-${slot}-${colDef.quadra.id}`);
      const cell = row.getCell(currentCol);

      if (reserva) {
        let texto = `${colDef.quadra.nome.toUpperCase()}`;
        if (reserva.time && reserva.time.responsaveis && reserva.time.responsaveis.length > 0) {
          const resp = reserva.time.responsaveis[0].pessoa;
          texto += `\n${reserva.time.nome.toUpperCase()}\nCPF: ${resp.cpf}\nTEF: ${resp.telefone || ''}`;
        } else if (reserva.user) {
          const cpf = reserva.user.id.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
          texto += `\n${reserva.user.name.toUpperCase()}\nCPF: ${cpf}`;
          if (reserva.user.telefone) {
            texto += `\nTEF: ${reserva.user.telefone}`;
          }
        } else {
          texto += `\n${reserva.operador?.name ? `Operador: ${reserva.operador.name.toUpperCase()}` : 'N/A'}`;
        }
        texto += `\nSlot: ${slot}`;
        
        cell.value = texto;
        cell.alignment = { wrapText: true, vertical: 'top', horizontal: 'left' };
        cell.border = {
          top: { style: 'medium', color: { argb: 'FF000000' } },
          left: { style: 'medium', color: { argb: 'FF000000' } },
          bottom: { style: 'medium', color: { argb: 'FF000000' } },
          right: { style: 'medium', color: { argb: 'FF000000' } }
        };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };

      } else {
        cell.value = '';
        cell.border = {
          top: { style: 'dotted', color: { argb: 'FFCCCCCC' } },
          bottom: { style: 'dotted', color: { argb: 'FFCCCCCC' } },
          left: { style: 'thin', color: { argb: 'FFEEEEEE' } },
          right: { style: 'thin', color: { argb: 'FFEEEEEE' } }
        };
      }
      currentCol++;
    }
    currentRow++;
  }

  // Largura das colunas
  worksheet.getColumn(1).width = 12; // Coluna de horário
  for (let i = 2; i <= lastColIndex; i++) {
    worksheet.getColumn(i).width = 24;
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

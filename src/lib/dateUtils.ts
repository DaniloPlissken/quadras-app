/**
 * Utilitários para formatação e manipulação de datas do sistema.
 */

/**
 * Recebe uma data (string ISO UTC "YYYY-MM-DDT..." ou objeto Date) que representa uma data civil (sem hora definida).
 * Retorna a formatação estrita da data no formato "DD/MM/YYYY" ignorando o fuso horário local do navegador.
 * Essa função previne o recuo indesejado da data quando o banco a retorna como meia-noite UTC (ex: 00:00:00.000Z).
 */
export function formatDataCivilBR(dataInput: string | Date): string {
  if (!dataInput) return '';

  // Se for string, extrair apenas a parte da data 'YYYY-MM-DD'
  if (typeof dataInput === 'string') {
    const dataParte = dataInput.split('T')[0];
    if (!dataParte) return '';
    
    const [ano, mes, dia] = dataParte.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  // Se for Date local/UTC vindo direto do objeto e precisa ignorar timezone local, 
  // pegamos explicitamente os valores UTC.
  const ano = dataInput.getUTCFullYear();
  const mes = String(dataInput.getUTCMonth() + 1).padStart(2, '0');
  const dia = String(dataInput.getUTCDate()).padStart(2, '0');
  
  return `${dia}/${mes}/${ano}`;
}

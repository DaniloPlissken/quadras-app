import React from 'react';

export function CellFechado() {
  return (
    <td className="border border-slate-200 bg-slate-100/50 p-2 text-center text-slate-400 italic">
      Fechado
    </td>
  );
}

export function CellLivre() {
  return (
    <td className="border border-slate-300 bg-white p-2 text-center text-emerald-600 font-semibold align-middle hover:bg-slate-50 transition-colors">
      Livre
    </td>
  );
}

interface CellReservaProps {
  infoTexto: string;
  subInfo: string;
}

export function CellReserva({ infoTexto, subInfo }: CellReservaProps) {
  return (
    <td className="border-2 border-[#004B87] bg-blue-50/30 p-2 align-middle hover:bg-blue-50 transition-colors cursor-default">
      <div className="font-bold text-slate-900 text-sm">{infoTexto}</div>
      <div className="text-slate-600 font-medium mt-1">{subInfo}</div>
    </td>
  );
}

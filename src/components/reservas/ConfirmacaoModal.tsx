import { useState } from "react";
import { AlertTriangle, Info, X } from "lucide-react";

interface ConfirmacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (emailConfirmacao: string) => void;
  quadraNome: string;
  data: string;
  horario: string;
  emailPadrao: string;
}

export function ConfirmacaoModal({
  isOpen,
  onClose,
  onConfirm,
  quadraNome,
  data,
  horario,
  emailPadrao
}: ConfirmacaoModalProps) {
  const [emailConfirmacao, setEmailConfirmacao] = useState(emailPadrao);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-[#004B87] p-4 text-white flex justify-between items-center">
          <h2 className="text-lg font-bold">Confirmação de Reserva</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Info Reserva */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <p className="text-sm text-slate-500 font-medium">Você está reservando:</p>
            <p className="text-lg font-bold text-[#004B87] mt-1">{quadraNome}</p>
            <div className="flex gap-4 mt-2 text-sm font-semibold text-slate-700">
              <span>📅 {data}</span>
              <span>⏰ {horario}</span>
            </div>
          </div>

          {/* Regras do Parque */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-500" /> Regras do Parque do Sabiá
            </h3>
            <ul className="text-sm text-slate-600 space-y-2 pl-7 list-disc">
              <li>Chegue com <strong>15 minutos de antecedência</strong> do seu horário.</li>
              <li>Apresente documento original com foto na portaria.</li>
              <li>O não comparecimento sem cancelamento prévio resultará em bloqueio para futuras reservas.</li>
            </ul>
          </div>

          {/* Alerta de Cancelamento */}
          <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl flex gap-3 text-sm text-orange-800">
            <AlertTriangle className="w-5 h-5 shrink-0 text-orange-500 mt-0.5" />
            <p>
              A FUTEL reserva-se o direito de <strong>cancelar a reserva</strong> em caso de força maior (como chuvas fortes ou manutenção emergencial). Fique de olho no seu e-mail.
            </p>
          </div>

          {/* Email de Contato */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-800">
              E-mail para recebimento de atualizações
            </label>
            <input 
              type="email" 
              value={emailConfirmacao}
              onChange={(e) => setEmailConfirmacao(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#004B87] focus:border-transparent transition-all"
              placeholder="seu.email@exemplo.com"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg text-slate-600 font-semibold hover:bg-slate-200 transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={() => onConfirm(emailConfirmacao)}
            className="px-5 py-2.5 rounded-lg bg-[#009A44] hover:bg-[#008A3D] text-white font-bold transition-colors shadow-sm"
          >
            Concordar e Reservar
          </button>
        </div>

      </div>
    </div>
  );
}

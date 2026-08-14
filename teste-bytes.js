/* eslint-disable @typescript-eslint/no-require-imports */
console.log('🧪 Iniciando teste de limite de bytes (UTF-8)...');

function validarTamanho(password) {
  if (Buffer.byteLength(password, 'utf8') > 72) {
    return { error: 'A senha excedeu o limite máximo seguro de 72 bytes.' };
  }
  return { success: true };
}

const p72_ascii = 'a'.repeat(72);
const p73_ascii = 'a'.repeat(73);
// 1 emoji = 4 bytes. 18 emojis = 72 bytes.
const p72_emoji = '🔥'.repeat(18);
// 19 emojis = 76 bytes (apesar de ter apenas 19 "caracteres" visuais).
const p76_emoji = '🔥'.repeat(19);

const cenarios = [
  { desc: 'Senha com 72 bytes (ASCII)', pass: p72_ascii, esperadoErro: false },
  { desc: 'Senha com 73 bytes (ASCII)', pass: p73_ascii, esperadoErro: true },
  { desc: 'Senha com 72 bytes (Multibyte/Emoji)', pass: p72_emoji, esperadoErro: false },
  { desc: 'Senha com 76 bytes (19 Emojis)', pass: p76_emoji, esperadoErro: true },
];

let falhou = false;

for (const cenario of cenarios) {
  const result = validarTamanho(cenario.pass);
  const deuErro = !!result.error;
  
  const compVisual = cenario.pass.length;
  const compBytes = Buffer.byteLength(cenario.pass, 'utf8');

  console.log(`[${compVisual} chars | ${compBytes} bytes] ${cenario.desc}`);
  
  if (deuErro === cenario.esperadoErro) {
    console.log(`   ✅ Passou no teste!`);
  } else {
    console.error(`   ❌ Falhou! (Esperava erro: ${cenario.esperadoErro})`);
    falhou = true;
  }
}

if (!falhou) {
  console.log('\nTodos os testes lógicos estão corretos!');
}

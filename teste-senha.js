// teste-senha.js
/* eslint-disable @typescript-eslint/no-require-imports */
console.log('🧪 Iniciando teste lógico de Validação de Senha...');

function validarSenhaMock(password) {
  if (password.trim().length === 0) {
    return { error: 'A senha não pode ser vazia ou composta apenas por espaços.' };
  }
  return { success: true };
}

const cenarios = [
  { desc: 'Senha com 6 espaços', pass: '      ', esperadoErro: true },
  { desc: 'Senha vazia', pass: '', esperadoErro: true },
  { desc: 'Senha válida com espaços ( 123456 )', pass: ' 123456 ', esperadoErro: false },
  { desc: 'Senha válida sem espaços', pass: '123456', esperadoErro: false },
];

let falhou = false;

for (const cenario of cenarios) {
  const result = validarSenhaMock(cenario.pass);
  const deuErro = !!result.error;
  
  if (deuErro === cenario.esperadoErro) {
    console.log(`✅ ${cenario.desc} -> Passou no teste!`);
  } else {
    console.error(`❌ ${cenario.desc} -> Falhou! (Esperava erro: ${cenario.esperadoErro})`);
    falhou = true;
  }
}

if (!falhou) {
  console.log('\nTodos os testes lógicos estão corretos!');
}

/**
 * Script para executar todos os testes de banco de dados
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Função para executar um teste individual
function runTest(testFile) {
  return new Promise((resolve) => {
    console.log(`\n================================================================================`);
    console.log(`Executando teste: ${testFile}`);
    console.log(`================================================================================\n`);
    
    // Criar um arquivo temporário para capturar a saída
    const tempOutputFile = `${testFile}.output.tmp`;
    
    // Redirecionar a saída para um arquivo e para o console
    const testProcess = spawn('node', [testFile], { 
      stdio: ['inherit', 'pipe', 'pipe']
    });
    
    let output = '';
    
    testProcess.stdout.on('data', (data) => {
      const chunk = data.toString();
      output += chunk;
      process.stdout.write(chunk);
    });
    
    testProcess.stderr.on('data', (data) => {
      const chunk = data.toString();
      output += chunk;
      process.stderr.write(chunk);
    });
    
    testProcess.on('close', (code) => {
      // Verificar se houve erros na saída
      const hasErrors = output.includes('ERRO') || output.includes('Error:') || output.includes('error:');
      
      if (code === 0 && !hasErrors) {
        console.log(`\n✅ Teste ${testFile} concluído com sucesso!`);
        resolve({ file: testFile, success: true });
      } else {
        console.log(`\n❌ Teste ${testFile} falhou!${code !== 0 ? ` Código de saída: ${code}` : ' Erros encontrados na saída.'}`);
        resolve({ file: testFile, success: false });
      }
    });
  });
}

// Função principal para executar todos os testes
async function runAllTests() {
  // Encontrar todos os arquivos de teste
  const testFiles = fs.readdirSync('.')
    .filter(file => file.startsWith('test-db-') && file.endsWith('.js'));
  
  console.log(`Encontrados ${testFiles.length} arquivos de teste JavaScript.`);
  
  if (testFiles.length === 0) {
    console.log('Nenhum arquivo de teste encontrado. Convertendo arquivos TS para JS...');
    
    // Converter arquivos TS para JS
    const tsFiles = fs.readdirSync('.')
      .filter(file => file.startsWith('test-db-') && file.endsWith('.ts'));
    
    for (const tsFile of tsFiles) {
      const jsFile = tsFile.replace('.ts', '.js');
      console.log(`Convertendo ${tsFile} para ${jsFile}...`);
      
      // Ler o conteúdo do arquivo TS
      const tsContent = fs.readFileSync(tsFile, 'utf8');
      
      // Remover anotações de tipo
      let jsContent = tsContent
        .replace(/: string/g, '')
        .replace(/: number/g, '')
        .replace(/: boolean/g, '')
        .replace(/: any/g, '')
        .replace(/: void/g, '')
        .replace(/: Promise<.*?>/g, '')
        .replace(/<.*?>/g, '');
      
      // Escrever o conteúdo no arquivo JS
      fs.writeFileSync(jsFile, jsContent, 'utf8');
    }
    
    // Atualizar a lista de arquivos de teste
    const jsFiles = fs.readdirSync('.')
      .filter(file => file.startsWith('test-db-') && file.endsWith('.js'));
    
    if (jsFiles.length === 0) {
      console.log('Nenhum arquivo de teste JS encontrado após a conversão.');
      return;
    }
    
    console.log(`Encontrados ${jsFiles.length} arquivos de teste JS.`);
    testFiles.push(...jsFiles);
  }
  
  console.log(`Encontrados ${testFiles.length} arquivos de teste:`);
  testFiles.forEach(file => console.log(`- ${file}`));
  
  // Executar cada teste sequencialmente
  const results = [];
  for (const testFile of testFiles) {
    const result = await runTest(testFile);
    results.push(result);
  }
  
  // Exibir resumo dos resultados
  const successCount = results.filter(r => r.success).length;
  const failureCount = results.length - successCount;
  
  console.log(`\n================================================================================`);
  console.log(`RESUMO DOS TESTES DE BANCO DE DADOS`);
  console.log(`================================================================================`);
  console.log(`Total de testes executados: ${results.length}`);
  console.log(`✅ Testes bem-sucedidos: ${successCount}`);
  console.log(`❌ Testes com falha: ${failureCount}`);
  console.log(`================================================================================\n`);
  
  if (failureCount > 0) {
    console.log(`⚠️ Alguns testes de banco de dados falharam. Verifique os logs acima para mais detalhes.`);
  } else {
    console.log(`🎉 Todos os testes de banco de dados foram executados com sucesso!`);
  }
}

// Executar todos os testes
runAllTests();
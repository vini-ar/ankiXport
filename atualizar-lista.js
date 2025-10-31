// Importa os módulos necessários do Node.js
const fs = require('fs');
const path = require('path');

// --- Configuração ---
const jsonDirectory = path.join(__dirname, 'json_files');
const htmlFilePath = path.join(__dirname, 'index.html');
const regexParaLimparNome = /(\s\(\d+kbit_AAC\))?\.txt$/i;
// --- Fim da Configuração ---

console.log('Iniciando atualização da lista de arquivos...');

try {
    // 1. Ler todos os arquivos do diretório
    const files = fs.readdirSync(jsonDirectory);

    // 2. Filtrar apenas por arquivos .txt
    const txtFiles = files.filter(file => file.endsWith('.txt'));

    // 3. Mapear os arquivos para o formato { name, path }
    const fileObjects = txtFiles.map(file => {
        // Limpa o nome para o dropdown
        const cleanName = file.replace(regexParaLimparNome, '');
        
        // Cria o objeto no formato que o HTML espera
        return {
            name: cleanName,
            path: `json_files/${file}`
        };
    });

    // 4. Formatar a lista como uma string de código JavaScript
    // Usamos JSON.stringify para formatar corretamente os nomes (com aspas, etc)
    const newArrayString = fileObjects.map(obj => {
        return `            { name: ${JSON.stringify(obj.name)}, path: ${JSON.stringify(obj.path)} }`;
    }).join(',\n');

    // 5. Ler o conteúdo do index.html
    let htmlContent = fs.readFileSync(htmlFilePath, 'utf8');

    // 6. Encontrar e substituir o bloco da lista antiga no HTML
    // Usamos marcadores // START-LIST e // END-LIST para saber onde substituir
    const regexBloco = /const PRESET_JSON_FILES = \[\s*\/\/ START-LIST\s*([\s\S]*?)\s*\/\/ END-LIST\s*\];/m;  
    if (!regexBloco.test(htmlContent)) {
        throw new Error("Não consegui encontrar os marcadores '// START-LIST' e '// END-LIST' no index.html.");
    }

    const novoBlocoDeCodigo = `const PRESET_JSON_FILES = [ // START-LIST
${newArrayString}
        // END-LIST ];`;

    htmlContent = htmlContent.replace(regexBloco, novoBlocoDeCodigo);

    // 7. Salvar o arquivo index.html atualizado
    fs.writeFileSync(htmlFilePath, htmlContent, 'utf8');

    console.log(`Sucesso! O 'index.html' foi atualizado com ${txtFiles.length} arquivos.`);

} catch (error) {
    console.error('Ocorreu um erro:');
    console.error(error);
}
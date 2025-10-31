// Importa os módulos necessários do Node.js
const fs = require('fs');
const path = require('path');

// --- Configuração ---
const jsonDirectory = path.join(__dirname, 'json_files');
const htmlFilePath = path.join(__dirname, 'index.html');
const regexParaLimparNome = /(\s\(\d+kbit_aac\))?\.txt$/i;
// --- Fim da Configuração ---

console.log('Iniciando atualização da lista de arquivos (com estrutura de 3 níveis)...');

/**
 * Esta função lê um diretório recursivamente (até 3 níveis).
 * @param {string} baseDir - O diretório base (json_files).
 * @returns {Array} - Uma lista de objetos { name, path, materia, topico }
 */
function lerArquivosRecursivamente(baseDir) {
    let fileObjects = [];

    // Nível 1: Lê as Matérias (ex: "Histologia", "Biologia")
    const materias = fs.readdirSync(baseDir, { withFileTypes: true })
        .filter(item => item.isDirectory() && !item.name.startsWith('.'));

    for (const materia of materias) {
        const materiaPath = path.join(baseDir, materia.name);

        // Nível 2: Lê os Tópicos (ex: "TP 1", "TP 2")
        const topicos = fs.readdirSync(materiaPath, { withFileTypes: true })
            .filter(item => item.isDirectory() && !item.name.startsWith('.'));

        for (const topico of topicos) {
            const topicoPath = path.join(materiaPath, topico.name);

            // Nível 3: Lê os Arquivos (ex: "aula_1.txt")
            const arquivos = fs.readdirSync(topicoPath, { withFileTypes: true })
                .filter(item => item.isFile() && item.name.endsWith('.txt') && !item.name.startsWith('.'));

            for (const arquivo of arquivos) {
                // Limpa o nome para o dropdown
                const cleanName = arquivo.name.replace(regexParaLimparNome, '');
                
                // Cria o caminho relativo (ex: "json_files/Histologia/TP 1/aula_1.txt")
                const relativePath = path.join('json_files', materia.name, topico.name, arquivo.name)
                                         .replace(/\\/g, '/'); // Garante barras /

                fileObjects.push({
                    name: cleanName,
                    path: relativePath,
                    materia: materia.name,
                    topico: topico.name
                });
            }
        }
    }
    
    // Ordena por materia, topico e depois nome
    return fileObjects.sort((a, b) => {
        if (a.materia > b.materia) return 1;
        if (a.materia < b.materia) return -1;
        if (a.topico > b.topico) return 1;
        if (a.topico < b.topico) return -1;
        if (a.name > b.name) return 1;
        if (a.name < b.name) return -1;
        return 0;
    });
}

try {
    // 1. Ler todos os arquivos e subpastas
    const fileObjects = lerArquivosRecursivamente(jsonDirectory);

    // 2. Formatar a lista como uma string de código JavaScript
    const newArrayString = fileObjects.map(obj => {
        // Usamos JSON.stringify para formatar corretamente os nomes (com aspas, etc)
        return `            { name: ${JSON.stringify(obj.name)}, path: ${JSON.stringify(obj.path)}, materia: ${JSON.stringify(obj.materia)}, topico: ${JSON.stringify(obj.topico)} }`;
    }).join(',\n');

    // 3. Ler o conteúdo do index.html
    let htmlContent = fs.readFileSync(htmlFilePath, 'utf8');

    // 4. Encontrar e substituir o bloco da lista antiga no HTML
    const regexBloco = /const PRESET_JSON_FILES = \[\s*\/\/ START-LIST\s*([\s\S]*?)\s*\/\/ END-LIST\s*\]\s*;/m;
    
    if (!regexBloco.test(htmlContent)) {
        throw new Error("Não consegui encontrar os marcadores '// START-LIST' e '// END-LIST' no index.html.");
    }

    const novoBlocoDeCodigo = `const PRESET_JSON_FILES = [ // START-LIST
${newArrayString}
        // END-LIST
];`;

    htmlContent = htmlContent.replace(regexBloco, novoBlocoDeCodigo);

    // 5. Salvar o arquivo index.html atualizado
    fs.writeFileSync(htmlFilePath, htmlContent, 'utf8');

    console.log(`Sucesso! O 'index.html' foi atualizado com ${fileObjects.length} arquivos.`);

} catch (error) {
    console.error('Ocorreu um erro:');
    console.error(error);
}
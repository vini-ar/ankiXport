// app.js - Lógica Simplificada

// 1. Referências dos Elementos da UI
const aiResponseTextArea = document.getElementById('ai-response');
const processBtn = document.getElementById('process-btn');
const resetBtn = document.getElementById('reset-btn');
const flashcardsSection = document.getElementById('flashcards-section');
const flashcardsList = document.getElementById('flashcards-list');
const exportBtn = document.getElementById('export-btn');
const exportSection = document.getElementById('export-section');

let currentCards = []; // Para armazenar os cards processados

// app.js - Detector de biblioteca
console.log("Checando bibliotecas carregadas...");
console.log("Objeto AnkiExport:", window.AnkiExport);
console.log("Objeto GenAnki:", window.GenAnki);

const Lib = window.AnkiExport || window.GenAnki;

if (!Lib) {
    console.error("ERRO: A biblioteca genanki.js não foi reconhecida pelo navegador.");
} else {
    console.log("Biblioteca carregada com sucesso!");
}

exportBtn.addEventListener('click', async () => {
    const response = await fetch('/api/generate', {
        method: 'POST',
        body: JSON.stringify(currentCards),
        headers: { 'Content-Type': 'application/json' }
    });

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "meu_deck.apkg";
    a.click();
});

// 2. Função para Processar o JSON colado
processBtn.addEventListener('click', () => {
    try {
        const rawData = JSON.parse(aiResponseTextArea.value);
        
        // Supondo que o JSON da sua IA venha como um array de objetos:
        // [{ "pergunta": "...", "resposta": "..." }]
        currentCards = Array.isArray(rawData) ? rawData : (rawData.cards || []);

        if (currentCards.length === 0) {
            alert("Nenhum card encontrado no JSON!");
            return;
        }

        renderFlashcards();
        flashcardsSection.classList.remove('hidden');
        exportSection.classList.remove('hidden');
        
    } catch (e) {
        alert("Erro ao ler o JSON. Verifique se o formato está correto.");
        console.error(e);
    }
});

// 3. Mostrar os cards na tela para revisão
function renderFlashcards() {
    flashcardsList.innerHTML = '';
    currentCards.forEach((card, index) => {
        const cardEl = document.createElement('div');
        cardEl.className = "p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600";
        cardEl.innerHTML = `
            <p><strong>Frente:</strong> ${card.pergunta}</p>
            <p class="mt-2 text-gray-600 dark:text-gray-400"><strong>Verso:</strong> ${card.resposta}</p>
        `;
        flashcardsList.appendChild(cardEl);
    });
}

// 4. Exportar para .apkg (Usando a biblioteca genanki-js que está no seu HTML)
exportBtn.addEventListener('click', async () => {
    // Criar o Deck (Use um ID aleatório ou fixo)
    const deck = new GenAnki.Deck(12345678, "AnkiXport - Estudos Medicina");

    // Definir o Modelo do Card
    const model = new GenAnki.Model({
        name: "Basic Model",
        id: "87654321",
        flds: [{ name: "Front" }, { name: "Back" }],
        tmpl: [{
            name: "Card 1",
            qfmt: '<div class="card front">{{Front}}</div>',
            afmt: '<div class="card front">{{Front}}</div><hr id="answer"><div class="card back">{{Back}}</div>',
        }],
        css: ".card { font-family: arial; font-size: 20px; text-align: center; padding: 20px; }"
    });

    // Adicionar as Notas
    currentCards.forEach(card => {
        deck.addNote(model.note([card.pergunta, card.resposta]));
    });

    // Gerar o Pacote
    const package = new GenAnki.Package();
    package.addDeck(deck);
    
    const blob = await package.writeToFile();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AnkiXport_Cards.apkg`;
    a.click();
});

// 5. Botão Reset
resetBtn.addEventListener('click', () => {
    aiResponseTextArea.value = '';
    flashcardsSection.classList.add('hidden');
    exportSection.classList.add('hidden');
    currentCards = [];
}); 
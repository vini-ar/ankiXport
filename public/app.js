// Mapeamento dos elementos do seu HTML
const aiResponseTextArea = document.getElementById('ai-response');
const processBtn = document.getElementById('process-btn');
const exportBtn = document.getElementById('export-btn');
const exportSection = document.getElementById('export-section');
const clearBtn = document.getElementById('reset-btn')

// Novos elementos mapeados
const previewSection = document.getElementById('preview-section');
const summaryText = document.getElementById('summary-text');
const cardsPreviewList = document.getElementById('cards-preview-list');

processBtn.addEventListener('click', () => {
    try {
        const text = aiResponseTextArea.value.trim();
        if (!text) return alert("O JSON está vazio!");

        const rawData = JSON.parse(text);
        currentCards = Array.isArray(rawData) ? rawData : (rawData.cards || []);

        if (currentCards.length > 0) {
            previewSection.classList.remove('hidden');
            exportSection.classList.remove('hidden');
            summaryText.innerText = `Foram identificados ${currentCards.length} cards.`;

            cardsPreviewList.innerHTML = ''; 
            currentCards.forEach((card, index) => {
                const cardDiv = document.createElement('div');
                cardDiv.className = "p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm";
                cardDiv.innerHTML = `
                    <p class="text-xs font-bold text-blue-600 mb-1">CARD #${index + 1} (CLOZE)</p>
                    <p class="text-sm text-gray-900 dark:text-gray-100"><strong>Texto:</strong> ${card.text}</p>
                    <p class="text-xs text-gray-500 mt-1"><strong>Extra:</strong> ${card.extra || '---'}</p>
                    <p class="text-xs text-magenta-500 text-pink-500"><strong>Key Terms:</strong> ${card.key_terms || '---'}</p>
                `;
                cardsPreviewList.appendChild(cardDiv);
            });
        }
    } catch (e) {
        alert("Erro no JSON!");
    }
});
// --- LOGICA 2: EXPORTAR .APKG ---
exportBtn.addEventListener('click', async () => {
    if (currentCards.length === 0) return;

    console.log("Enviando para o Backend...");
    exportBtn.innerText = "Gerando .apkg...";
    exportBtn.disabled = true;

    try {
        // No seu app.js
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // Enviamos o array puro para simplificar a vida do Python
            body: JSON.stringify(currentCards) 
        });

        if (!response.ok) throw new Error("Erro na API.");

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "Anatomia_UNLP.apkg";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

    } catch (err) {
        console.error(err);
        alert("Erro ao exportar. O vercel dev está rodando?");
    } finally {
        exportBtn.innerText = "Export Selected (.apkg)";
        exportBtn.disabled = false;
    }
});

clearBtn.addEventListener('click', () => {
    // Limpa apenas o texto da área de colagem
    aiResponseTextArea.value = '';
    
    // Coloca o cursor de volta no campo (UX de Engenharia!)
    aiResponseTextArea.focus();
    
    console.log("TextArea limpa. O estado dos cards permanece intacto.");
});
// Elementos da Interface
const aiResponseTextArea = document.getElementById('ai-response');
const processBtn = document.getElementById('process-btn');
const exportBtn = document.getElementById('export-btn');

let currentCards = [];

// 1. Processar o JSON (Igual ao que você já tinha)
processBtn.addEventListener('click', () => {
    try {
        const text = aiResponseTextArea.value.trim();
        if (!text) return alert("Cole o JSON primeiro!");
        
        const rawData = JSON.parse(text);
        currentCards = Array.isArray(rawData) ? rawData : (rawData.cards || []);
        
        if (currentCards.length > 0) {
            alert(`Sucesso! ${currentCards.length} cards prontos.`);
            document.getElementById('export-section').classList.remove('hidden');
        }
    } catch (e) {
        alert("Erro no formato do JSON.");
        console.error(e);
    }
});

// 2. Exportar via Vercel Python (A solução definitiva)
exportBtn.addEventListener('click', async () => {
    console.log("Chamando backend Python...");
    
    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(currentCards)
        });

        if (!response.ok) throw new Error("Erro no processamento do servidor.");

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "Anatomia_UNLP.apkg";
        a.click();
        
        console.log("Download iniciado!");
    } catch (err) {
        alert("Ocorreu um erro na API. Verifique os logs no Vercel.");
        console.error(err);
    }
});
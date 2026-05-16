/**
 * AnkiXportApp - Standalone Cloze Edition
 * Processa dados estruturados em JSON diretamente de uma Textarea
 * e os formata em flashcards Cloze puros práticos para exportação para o Anki.
 */
const AnkiXportApp = {
    // --- State ---
    flashcardsData: [],     
    originalButtonText: {}, 
    elements: {},           

    // --- Configuration ---
    imageOptimization: {
        maxWidth: 800,      
        maxHeight: 800,     
        quality: 0.85,      
        outputFormat: 'image/jpeg' 
    },

    // --- Initialization ---
    cacheElements() {
        this.elements.aiResponseTextarea = document.getElementById('ai-response');
        this.elements.processBtn = document.getElementById('process-btn');
        this.elements.resetBtn = document.getElementById('reset-btn');
        this.elements.explanationSection = document.getElementById('explanation-section');
        this.elements.explanationContent = document.getElementById('explanation-content');
        this.elements.modificationsSection = document.getElementById('modifications-section');
        this.elements.modificationsContent = document.getElementById('modifications-content');
        this.elements.flashcardsSection = document.getElementById('flashcards-section');
        this.elements.flashcardsList = document.getElementById('flashcards-list');
        this.elements.flashcardCounterElement = document.getElementById('flashcard-counter');
        this.elements.selectAllBtn = document.getElementById('select-all-btn');
        this.elements.deselectAllBtn = document.getElementById('deselect-all-btn');
        this.elements.exportSection = document.getElementById('export-section');
        this.elements.exportBtn = document.getElementById('export-btn');
        this.elements.globalFrontExtra = document.getElementById('global-front-extra');
        this.elements.globalBackExtra = document.getElementById('global-back-extra');
        this.elements.clearFrontExtraBtn = document.getElementById('clear-front-extra-btn');
        this.elements.clearBackExtraBtn = document.getElementById('clear-back-extra-btn');
        this.elements.inputSection = document.getElementById('input-section'); 
        this.elements.notificationArea = document.getElementById('notification-area');

        // Cache dos textos originais dos botões para gerenciamento de loading
        ['processBtn', 'exportBtn', 'selectAllBtn', 'deselectAllBtn'].forEach(key => {
            if (this.elements[key]) this.originalButtonText[key] = this.elements[key].textContent;
        });
    },

    bindEvents() {
        this.elements.processBtn.addEventListener('click', this.processText.bind(this));
        this.elements.resetBtn.addEventListener('click', this.resetApp.bind(this));
        this.elements.exportBtn.addEventListener('click', this.exportFlashcards.bind(this));
        this.elements.selectAllBtn.addEventListener('click', () => this.toggleSelectAll(true));
        this.elements.deselectAllBtn.addEventListener('click', () => this.toggleSelectAll(false));

        this.elements.clearFrontExtraBtn.addEventListener('click', () => this.clearExtraField(this.elements.globalFrontExtra));
        this.elements.clearBackExtraBtn.addEventListener('click', () => this.clearExtraField(this.elements.globalBackExtra));

        [this.elements.globalFrontExtra, this.elements.globalBackExtra].forEach(field => {
            field.addEventListener('paste', this.handlePaste.bind(this));
            field.addEventListener('input', this.handleInput.bind(this));
        });

        this.elements.flashcardsList.addEventListener('change', this.handleFlashcardCheckboxChange.bind(this));
    },

    init() {
        this.cacheElements();
        this.bindEvents();
        console.info("AnkiXportApp inicializado em modo direto e independente.");
    },

    clearExtraField(field) {
        field.innerHTML = '';
        this.handleInput({ target: field });
    },

    // --- Core Logic ---
    processText() {
        this.setButtonLoading('processBtn', true);
        this.resetUiState();

        try {
            const jsonInput = this.elements.aiResponseTextarea.value.trim();
            if (!jsonInput) return this.showMessage('O campo de entrada do JSON está vazio.', 'error');

            const parsedData = JSON.parse(jsonInput);

            if (!parsedData || typeof parsedData !== 'object' || !Array.isArray(parsedData.flashcards)) {
                return this.showMessage('Estrutura inválida. O JSON precisa conter uma array contendo "flashcards".', 'error');
            }

            // Renderiza seções acessórias se presentes
            if (parsedData.explanation && parsedData.explanation.trim() !== '') {
                this.elements.explanationContent.innerHTML = parsedData.explanation;
                this.elements.explanationSection.classList.remove('hidden');
            }

            if (Array.isArray(parsedData.modifications) && parsedData.modifications.length > 0) {
                this.elements.modificationsContent.innerHTML = `<ul>${parsedData.modifications.map(mod => `<li>${mod}</li>`).join('')}</ul>`;
                this.elements.modificationsSection.classList.remove('hidden');
            }

            // Mapeia e valida a array de flashcards puros
            this.flashcardsData = parsedData.flashcards
                .map(line => typeof line === 'string' ? line.trim() : '')
                .filter(line => line !== '')
                .map((line, index) => ({
                    id: `fc-${index + 1}`,
                    originalText: line,
                    selected: true, // Já inicia marcado para ganho de velocidade (UX!)
                    isValid: /\{\{c\d*::.*?\}\}/is.test(line),
                    exported: false
                }));

            if (this.flashcardsData.length > 0) {
                this.renderFlashcards();
                this.elements.flashcardsSection.classList.remove('hidden');
                this.elements.exportSection.classList.remove('hidden');
                this.elements.inputSection.classList.add('pb-8', 'md:pb-12', 'border-b', 'border-gray-200', 'dark:border-gray-700');
            } else {
                this.showMessage('Nenhum flashcard válido encontrado na estrutura do arquivo.', 'info');
            }
        } catch (error) {
            this.showMessage(`Erro crítico de análise sintática no JSON: ${error.message}`, 'error');
        } finally {
            this.setButtonLoading('processBtn', false);
        }
    },

    resetUiState() {
        this.elements.explanationContent.innerHTML = '';
        this.elements.modificationsContent.innerHTML = '';
        this.elements.flashcardsList.innerHTML = '';
        this.elements.flashcardCounterElement.textContent = '';
        this.elements.explanationSection.classList.add('hidden');
        this.elements.modificationsSection.classList.add('hidden');
        this.elements.flashcardsSection.classList.add('hidden');
        this.elements.exportSection.classList.add('hidden');
        this.elements.inputSection.classList.remove('pb-8', 'md:pb-12', 'border-b', 'border-gray-200', 'dark:border-gray-700');
    },

    // --- Flashcard Rendering (Cloze Visual Highlight) ---
    renderFlashcards() {
        const listElement = this.elements.flashcardsList;
        listElement.innerHTML = '';
        const fragment = document.createDocumentFragment();
        
        let validCount = 0;
        let selectedCount = 0;

        this.flashcardsData.forEach(card => {
            if (card.isValid) validCount++;
            if (card.selected && card.isValid) selectedCount++;

            const cardItem = document.createElement('div');
            cardItem.className = `flashcard-item bg-white dark:bg-gray-800 border ${!card.isValid ? 'border-red-400 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-700'}`;
            cardItem.id = card.id;

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `check-${card.id}`;
            checkbox.className = 'flashcard-checkbox rounded border-gray-300 text-blue-600 focus:ring-blue-500';
            checkbox.checked = card.selected;
            checkbox.disabled = !card.isValid;

            const label = document.createElement('label');
            label.htmlFor = `check-${card.id}`;
            label.className = 'flashcard-content-wrapper w-full';

            const textContainer = document.createElement('div');
            textContainer.className = 'flashcard-text-container text-gray-800 dark:text-gray-100 p-3 bg-gray-50 dark:bg-gray-700/40 rounded border';
            
            // Renderização fluida da omissão com Badges (Transformação nativa do Anki na UI)
            textContainer.innerHTML = this.formatClozeText(card.originalText);

            if (!card.isValid) {
                const errorMsg = document.createElement('p');
                errorMsg.className = 'text-xs text-red-500 mt-2 font-mono';
                errorMsg.textContent = 'Aviso: Formato de omissão inválido para o Anki.';
                textContainer.appendChild(errorMsg);
            }

            label.appendChild(textContainer);
            cardItem.appendChild(checkbox);
            cardItem.appendChild(label);
            fragment.appendChild(cardItem);
        });

        listElement.appendChild(fragment);

        this.elements.flashcardCounterElement.textContent = `(Total Encontrado: ${this.flashcardsData.length} | Estrutura Válida: ${validCount})`;
        this.elements.selectAllBtn.disabled = validCount === 0;
        this.elements.deselectAllBtn.disabled = selectedCount === 0;
    },

    formatClozeText(text) {
        // Converte {{c1::termo}} em um elemento visual destacado na página
        return text.replace(/\{\{c(\d*)::(.*?)\}\}/gis, (match, clNumber, clText) => {
            const num = clNumber ? `c${clNumber}` : 'c1';
            return `<span class="mx-1 inline-block bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 font-semibold px-2 py-0.5 rounded border border-blue-300 dark:border-blue-700" title="Omissão [${num}]">[${num}] ${clText}</span>`;
        });
    },

    handleFlashcardCheckboxChange(event) {
        if (event.target.classList.contains('flashcard-checkbox')) {
            const cardId = event.target.id.replace('check-', '');
            const card = this.flashcardsData.find(fc => fc.id === cardId);
            if (card && card.isValid) card.selected = event.target.checked;
            
            const selectedCount = this.flashcardsData.filter(fc => fc.selected && fc.isValid).length;
            this.elements.deselectAllBtn.disabled = selectedCount === 0;
        }
    },

    toggleSelectAll(select) {
        this.flashcardsData.forEach(card => { if (card.isValid) card.selected = select; });
        this.renderFlashcards();
    },

    exportFlashcards() {
        const cardsToExport = this.flashcardsData.filter(card => card.selected && card.isValid);
        if (cardsToExport.length === 0) return this.showMessage("Selecione ao menos um card válido para exportação.", 'info');

        this.setButtonLoading('exportBtn', true);
        try {
            const frontExtra = this.escapeTsvField(this.elements.globalFrontExtra.innerHTML);
            const backExtra = this.escapeTsvField(this.elements.globalBackExtra.innerHTML);

            const tsvRows = cardsToExport.map(card => {
                return `${this.escapeTsvField(card.originalText)}\t${frontExtra}\t${backExtra}`;
            }).join('\n');

            // Configuração explícita para o tipo de nota nativo Cloze do Anki
            const headers = `#notetype:Cloze\n#separator:tab\n#html:true\n#columns:Text\tFront Extra\tBack Extra`;
            const fullContent = `${headers}\n${tsvRows}`;

            const blob = new Blob([fullContent], { type: 'text/tab-separated-values;charset=utf-8' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `Anki_Cloze_${new Date().toISOString().slice(0, 10)}.tsv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            cardsToExport.forEach(c => { c.selected = false; c.exported = true; });
            this.renderFlashcards();
            this.showMessage(`${cardsToExport.length} Cards exportados com êxito!`, 'success');
        } catch (error) {
            this.showMessage(`Erro operacional na exportação: ${error.message}`, 'error');
        } finally {
            this.setButtonLoading('exportBtn', false);
        }
    },

    escapeTsvField(value) {
        if (!value) return '';
        let strValue = String(value).replace(/\n/g, '<br>');
        if (strValue.includes('\t') || strValue.includes('"') || strValue.includes('<br>')) {
            return `"${strValue.replace(/"/g, '""')}"`;
        }
        return strValue;
    },

    // --- UI Utilities & Clipboard Ops ---
    setButtonLoading(key, isLoading) {
        const btn = this.elements[key];
        if (!btn) return;
        btn.disabled = isLoading;
        btn.textContent = isLoading ? (key === 'processBtn' ? 'Processando...' : 'Exportando...') : this.originalButtonText[key];
    },

    showMessage(text, type = 'error', duration = 4000) {
        if (!text || !this.elements.notificationArea) return;
        const toast = document.createElement('div');
        toast.className = `notification-toast ${type}`;
        toast.innerHTML = `<span>${text}</span><button class="notification-toast-close" onclick="this.parentElement.remove()">&times;</button>`;
        this.elements.notificationArea.appendChild(toast);
        void toast.offsetWidth;
        toast.classList.add('show');
        if (duration > 0) setTimeout(() => { if (toast.parentElement) toast.remove(); }, duration);
    },

    resetApp() {
        this.elements.aiResponseTextarea.value = '';
        this.clearExtraField(this.elements.globalFrontExtra);
        this.clearExtraField(this.elements.globalBackExtra);
        this.resetUiState();
        this.flashcardsData = [];
        this.showMessage('Interface redefinida.', 'info', 2000);
        this.elements.aiResponseTextarea.focus();
    },

    handleInput(event) {
        const target = event.target;
        if (target && target.isContentEditable && target.textContent.trim() === '' && !target.querySelector(':not(br)')) {
            target.innerHTML = '';
        }
    },

    async handlePaste(event) {
        event.preventDefault();
        const target = event.target;
        if (!target || !target.isContentEditable || !navigator.clipboard?.read) return;
        target.focus();

        try {
            const items = await navigator.clipboard.read();
            for (const item of items) {
                const imgType = item.types.find(t => t.startsWith('image/'));
                if (imgType) {
                    const blob = await item.getType(imgType);
                    const base64 = await this.optimizeAndConvertToBase64(blob);
                    document.execCommand('insertHTML', false, `<img src="${base64}" alt="Pasted Image">`);
                    break;
                }
                if (item.types.includes('text/html')) {
                    const html = await (await item.getType('text/html')).text();
                    document.execCommand('insertHTML', false, html);
                    break;
                }
                if (item.types.includes('text/plain')) {
                    const text = await (await item.getType('text/plain')).text();
                    document.execCommand('insertHTML', false, text.replace(/\n/g, '<br>'));
                    break;
                }
            }
        } catch (err) {
            this.showMessage("Não foi possível processar a área de transferência.", "error");
        } finally {
            target.dispatchEvent(new Event('input', { bubbles: true }));
        }
    },

    optimizeAndConvertToBase64(blob) {
        return new Promise((resolve, reject) => {
            const image = new Image();
            const objectUrl = URL.createObjectURL(blob);
            image.src = objectUrl;
            image.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                let w = image.naturalWidth, h = image.naturalHeight;
                if (w > 800) { h = (800 / w) * h; w = 800; }
                canvas.width = w; canvas.height = h;
                ctx.drawImage(image, 0, 0, w, h);
                resolve(canvas.toDataURL('image/jpeg', 0.85));
                URL.revokeObjectURL(objectUrl);
            };
            image.onerror = () => reject(new Error("Erro ao renderizar imagem carregada."));
        });
    }
};

document.addEventListener('DOMContentLoaded', () => AnkiXportApp.init());
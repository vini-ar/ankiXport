from http.server import BaseHTTPRequestHandler
import json
import genanki
import io

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        try:
            # O JSON que vem do app.js
            data = json.loads(post_data)
        except Exception as e:
            self.send_response(400)
            self.end_headers()
            self.wfile.write(f"Erro no JSON: {str(e)}".encode())
            return

        # 1. DEFINIÇÃO DO MODELO (O "DNA" DO CARTÃO PRO)
        PRO_MED_MODEL = genanki.Model(
            1607392319, # ID único e fixo
            'AnkiXport Pro Med Cloze',
            fields=[
                {'name': 'Text'},   # Onde vai o {{c1::cloze}}
                {'name': 'Extra'},  # Informação extra simples (como "Generalidades")
                {'name': 'KeyTerms'}, # Definições (aparecem abertas)
                {'name': 'ClinicalPearls'}, # Pérolas Clínicas (aparecem fechadas)
            ],
            templates=[
                {
                    'name': 'Anatomia Cloze',
                    'qfmt': '<div class="card-container">{{cloze:Text}}</div>',
                    'afmt': '''
                        <div class="card-container">
                            {{cloze:Text}}
                            <br><hr id="answer">
                            
                            <div class="extra-field">{{Extra}}</div>
                            
                            {{#KeyTerms}}
                            <div class="key-terms-container">
                                <div class="key-terms-title">Key Terms</div>
                                <div class="key-terms-text">{{KeyTerms}}</div>
                            </div>
                            {{/KeyTerms}}
                            
                            {{#ClinicalPearls}}
                            <button type="button" class="btn-med" onclick="toggleField('clinical-pearls')">Clinical Pearls</button>
                            <div id="clinical-pearls" class="clinical-pearls-container" style="display:none;">
                                <div class="clinical-pearls-title">Clinical Pearls</div>
                                <div class="clinical-pearls-text">{{ClinicalPearls}}</div>
                            </div>
                            {{/ClinicalPearls}}
                        </div>

                        <script>
                        function toggleField(id) {
                            var x = document.getElementById(id);
                            if (x.style.display === "none") {
                                x.style.display = "block";
                            } else {
                                x.style.display = "none";
                            }
                        }
                        </script>
                    ''',
                },
            ],
            # CSS PARA BATER COM OS PRINTS
            css='''
                .card { font-family: "Helvetica", "Arial", sans-serif; font-size: 20px; text-align: center; color: white; background-color: #1a1a1a; }
                .card-container { padding: 20px; }
                .cloze { font-weight: bold; color: #3ea6ff; }
                
                /* Estilo dos Botões */
                .btn-med {
                    background-color: #2b2b2b;
                    color: #d1d1d1;
                    border: 1px solid #444;
                    border-radius: 6px;
                    padding: 6px 14px;
                    font-size: 14px;
                    cursor: pointer;
                    margin-top: 25px;
                    transition: 0.2s;
                }
                .btn-med:hover { background-color: #3d3d3d; }
                
                .extra-field { font-size: 17px; color: #aaa; margin: 15px 0; }

                /* ESTILO KEY TERMS (IGUAL AOS PRINTS) */
                .key-terms-container {
                    margin-top: 20px;
                    text-align: left;
                    display: inline-block;
                }
                .key-terms-title {
                    color: #ff00ff; /* Magenta vibrante */
                    font-weight: bold;
                    font-style: italic;
                    font-size: 24px;
                    text-transform: uppercase;
                    margin-bottom: 5px;
                }
                .key-terms-text {
                    color: #ff00ff;
                    font-style: italic;
                    font-size: 19px;
                    line-height: 1.5;
                }
                .key-terms-text b, .key-terms-text strong {
                    text-decoration: underline;
                }

                /* ESTILO CLINICAL PEARLS (FUNDO CLARO) */
                .clinical-pearls-container {
                    margin-top: 15px;
                    padding: 15px;
                    background-color: #e6f0fa; /* Azul clarinho */
                    border-radius: 8px;
                    color: #333;
                    text-align: left;
                    display: inline-block;
                }
                .clinical-pearls-title {
                    color: #1a5cad;
                    font-weight: bold;
                    font-size: 22px;
                    margin-bottom: 10px;
                }
                .clinical-pearls-text {
                    font-size: 17px;
                    line-height: 1.4;
                }
            ''',
            model_type=genanki.Model.CLOZE
        )

        # 2. CRIAÇÃO DO DECK
        my_deck = genanki.Deck(2059400110, 'Anatomia UNLP :: AnkiXport Pro')

        # 3. MAPEAMENTO DOS DADOS DO JSON
        for card in data:
            my_note = genanki.Note(
                model=PRO_MED_MODEL,
                fields=[
                    str(card['text']), 
                    str(card.get('extra', '')), 
                    str(card.get('key_terms', '')), 
                    str(card.get('clinical_pearls', ''))
                ]
            )
            my_deck.add_note(my_note)

        # 4. GERAÇÃO DO BINÁRIO
        output = io.BytesIO()
        genanki.Package(my_deck).write_to_file(output)
        
        self.send_response(200)
        self.send_header('Content-type', 'application/octet-stream')
        self.send_header('Content-Disposition', 'attachment; filename="Anatomia_UNLP.apkg"')
        self.end_headers()
        self.wfile.write(output.getvalue())
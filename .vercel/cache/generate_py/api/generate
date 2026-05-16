from http.server import BaseHTTPRequestHandler
import json
import genanki
import io

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        try:
            data = json.loads(post_data)
        except:
            self.send_response(400)
            self.end_headers()
            return

        # 1. MODELO PRO (KeyTerms no campo Extra + ClinicalPearls Colapsável)
        PRO_MED_MODEL = genanki.Model(
            1607392319,
            'AnkiXport UNLP Pro',
            fields=[
                {'name': 'Text'},           # O {{c1::cloze}}
                {'name': 'Extra'},          # SERÁ O KEY TERMS (Sempre aberto)
                {'name': 'ClinicalPearls'}, # Colapsável (Botão)
            ],
            templates=[
                {
                    'name': 'Anatomia Cloze',
                    'qfmt': '<div class="card-container">{{cloze:Text}}</div>',
                    'afmt': '''
                        <div class="card-container">
                            {{cloze:Text}}
                            <br><hr id="answer">
                            
                            <div class="key-terms-section">
                                <div class="key-terms-title">Key Terms</div>
                                <div class="key-terms-body">{{Extra}}</div>
                            </div>
                            
                            {{#ClinicalPearls}}
                            <button type="button" class="btn-pearls" onclick="toggleCP()">Clinical Pearls</button>
                            <div id="cp-content" class="cp-container" style="display:none;">
                                <div class="cp-title">Clinical Pearls</div>
                                <div class="cp-text">{{ClinicalPearls}}</div>
                            </div>
                            {{/ClinicalPearls}}
                        </div>

                        <script>
                        function toggleCP() {
                            var x = document.getElementById("cp-content");
                            x.style.display = (x.style.display === "none") ? "block" : "none";
                        }
                        </script>
                    ''',
                },
            ],
            css='''
                .card { font-family: "Helvetica", "Arial", sans-serif; font-size: 22px; text-align: center; color: white; background-color: #1a1a1a; }
                .card-container { padding: 20px; }
                .cloze { font-weight: bold; color: #3ea6ff; }
                
                /* ESTILO KEY TERMS (MAGENTA - SEMPRE ABERTO) */
                .key-terms-section { margin-top: 20px; text-align: left; display: inline-block; width: 100%; }
                .key-terms-title { color: #ff00ff; font-weight: bold; font-style: italic; font-size: 24px; text-transform: uppercase; }
                .key-terms-body { color: #ff00ff; font-style: italic; font-size: 19px; line-height: 1.5; margin-top: 5px; }
                .key-terms-body b, .key-terms-body strong { text-decoration: underline; }

                /* BOTÃO CLINICAL PEARLS */
                .btn-pearls { background-color: #2b2b2b; color: #d1d1d1; border: 1px solid #444; border-radius: 6px; padding: 6px 14px; font-size: 14px; cursor: pointer; margin-top: 25px; }
                
                /* CONTEÚDO CLINICAL PEARLS (AZULADO) */
                .cp-container { margin-top: 15px; padding: 15px; background-color: #e6f0fa; border-radius: 8px; color: #333; text-align: left; }
                .cp-title { color: #1a5cad; font-weight: bold; font-size: 20px; margin-bottom: 8px; }
                .cp-text { font-size: 17px; line-height: 1.4; }
            ''',
            model_type=genanki.Model.CLOZE
        )

        my_deck = genanki.Deck(2059400110, 'Anatomia UNLP :: Pro Cards')

        for card in data:
            my_note = genanki.Note(
                model=PRO_MED_MODEL,
                fields=[
                    str(card['text']), 
                    str(card.get('extra', '')), # Key Terms aqui
                    str(card.get('clinical_pearls', ''))
                ]
            )
            my_deck.add_note(my_note)

        output = io.BytesIO()
        genanki.Package(my_deck).write_to_file(output)
        
        self.send_response(200)
        self.send_header('Content-type', 'application/octet-stream')
        self.send_header('Content-Disposition', 'attachment; filename="Anatomia_Pro.apkg"')
        self.end_headers()
        self.wfile.write(output.getvalue())
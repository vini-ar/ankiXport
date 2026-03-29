from http.server import BaseHTTPRequestHandler
import json
import genanki
import os
import random

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data)
            
            # Validação básica
            if not isinstance(data, list):
                raise ValueError("O payload deve ser uma lista de cards.")

            # MODELO PRO (Cloze)
            # Dica: IDs devem ser únicos e consistentes
            model_id = 1607392319
            PRO_MED_MODEL = genanki.Model(
                model_id,
                'AnkiXport UNLP Pro',
                fields=[
                    {'name': 'Text'},
                    {'name': 'Extra'},
                    {'name': 'ClinicalPearls'},
                ],
                templates=[{
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
                }],
                css='.card { font-family: arial; font-size: 20px; text-align: center; color: white; background-color: #1a1a1a; } .cloze { color: #3ea6ff; font-weight: bold; }', # CSS simplificado para exemplo
                model_type=genanki.Model.CLOZE
            )

            my_deck = genanki.Deck(2059400110, 'Anatomia UNLP :: Pro Cards')

            for card in data:
                # Garante que campos existem para evitar KeyError
                text = card.get('text', '')
                extra = card.get('extra', '')
                pearls = card.get('clinical_pearls', '')
                
                # O genanki.Note para Cloze precisa que o campo 'Text' contenha {{c1::...}}
                my_note = genanki.Note(
                    model=PRO_MED_MODEL,
                    fields=[str(text), str(extra), str(pearls)]
                )
                my_deck.add_note(my_note)

            # --- CORREÇÃO PARA VERCEL ---
            # Salva temporariamente em /tmp, que é o único lugar com permissão de escrita
            temp_path = "/tmp/Anatomia_Pro.apkg"
            genanki.Package(my_deck).write_to_file(temp_path)

            # Lê o arquivo gerado para enviar na resposta
            with open(temp_path, "rb") as f:
                output_data = f.read()

            # Limpa o arquivo temporário
            os.remove(temp_path)

            self.send_response(200)
            self.send_header('Content-type', 'application/octet-stream')
            self.send_header('Content-Disposition', 'attachment; filename="Anatomia_Pro.apkg"')
            self.send_header('Access-Control-Allow-Origin', '*') # Importante para CORS se o front for diferente
            self.end_headers()
            self.wfile.write(output_data)

        except Exception as e:
            # Captura qualquer erro e envia como 500 para debug
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {"error": str(e)}
            self.wfile.write(json.dumps(response).encode())
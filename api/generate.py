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

            # 1. DEFINIÇÃO DO MODELO (O "DNA" DO CARTÃO)
            PRO_MED_MODEL = genanki.Model(
                1607392319,
                'AnkiXport Pro Med Cloze',
                fields=[
                    {'name': 'Text'},
                    {'name': 'Extra'},
                    {'name': 'KeyTerms'},
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
                                <button type="button" class="btn-med" onclick="toggleField('key-terms')">Key Terms</button>
                                <div id="key-terms" class="med-content" style="display:none;">
                                    <div class="key-terms-title">Key Terms</div>
                                    <div class="key-terms-text">{{KeyTerms}}</div>
                                </div>
                                {{/KeyTerms}}
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
                css='''
                    .card { font-family: "Helvetica", "Arial", sans-serif; font-size: 22px; text-align: center; color: white; background-color: #1a1a1a; }
                    .card-container { padding: 20px; }
                    .cloze { font-weight: bold; color: #3ea6ff; }
                    .btn-med { background-color: #2b2b2b; color: #d1d1d1; border: 1px solid #444; border-radius: 6px; padding: 6px 14px; font-size: 14px; cursor: pointer; margin-top: 25px; }
                    .extra-field { font-size: 18px; color: #aaa; margin: 15px 0; }
                    .key-terms-title { color: #ff00ff; font-weight: bold; font-style: italic; font-size: 24px; margin-top: 15px; }
                    .key-terms-text { color: #ff00ff; font-style: italic; font-size: 19px; }
                ''',
                model_type=genanki.Model.CLOZE
            )

            # 2. CRIAÇÃO DO DECK
            my_deck = genanki.Deck(2059400110, 'Anatomia UNLP :: AnkiXport')

            # 3. MAPEAMENTO DOS DADOS (O BLOCO QUE VOCÊ MANDOU)
            if isinstance(data, list):
                cards_list = data
            elif isinstance(data, dict):
                cards_list = data.get('cards', [])
            else:
                cards_list = []

            for card in cards_list:
                # O .get(key, default) evita que o código quebre se o campo faltar
                text = card.get('text', card.get('pergunta', 'Card sem texto'))
                extra = card.get('extra', card.get('resposta', ''))
                key_terms = card.get('key_terms', '')

                my_note = genanki.Note(
                    model=PRO_MED_MODEL,
                    fields=[str(text), str(extra), str(key_terms)]
                )
                my_deck.add_note(my_note) # Apenas uma vez!

            # 4. GERAÇÃO DO BINÁRIO
            output = io.BytesIO()
            genanki.Package(my_deck).write_to_file(output)
            
            self.send_response(200)
            self.send_header('Content-type', 'application/octet-stream')
            self.send_header('Content-Disposition', 'attachment; filename="Anatomia_UNLP.apkg"')
            self.end_headers()
            self.wfile.write(output.getvalue())

        except Exception as e:
            # Se der erro 500, o motivo vai aparecer no seu terminal e no alert do navegador
            print(f"ERRO NO BACKEND: {str(e)}")
            self.send_response(500)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(f"Erro no servidor Python: {str(e)}".encode())
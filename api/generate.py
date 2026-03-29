from http.server import BaseHTTPRequestHandler
import json
import genanki
import os
import traceback

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data)

            # 1. Configuração do Modelo
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
                    'afmt': '{{cloze:Text}}<br><hr id="answer">{{Extra}}<br>{{ClinicalPearls}}',
                }],
                model_type=genanki.Model.CLOZE
            )

            my_deck = genanki.Deck(2059400110, 'Anatomia UNLP :: Pro Cards')

            for card in data:
                my_note = genanki.Note(
                    model=PRO_MED_MODEL,
                    fields=[str(card.get('text', '')), str(card.get('extra', '')), str(card.get('clinical_pearls', ''))]
                )
                my_deck.add_note(my_note)

            # 2. ESCRITA NO /TMP (Obrigatório no Vercel)
            output_filename = "/tmp/Anatomia_Pro.apkg"
            genanki.Package(my_deck).write_to_file(output_filename)

            # 3. Lendo o arquivo para enviar
            with open(output_filename, "rb") as f:
                file_data = f.read()

            self.send_response(200)
            self.send_header('Content-type', 'application/octet-stream')
            self.send_header('Content-Disposition', 'attachment; filename="Anatomia_Pro.apkg"')
            # Habilita CORS para evitar erros de domínio
            self.send_header('Access-Control-Allow-Origin', '*') 
            self.end_headers()
            self.wfile.write(file_data)

            # Limpeza
            if os.path.exists(output_filename):
                os.remove(output_filename)

        except Exception as e:
            # Se der erro, envia o erro detalhado para o navegador
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            error_message = {
                "error": str(e),
                "traceback": traceback.format_exc()
            }
            self.wfile.write(json.dumps(error_message).encode())
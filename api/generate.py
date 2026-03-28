from http.server import BaseHTTPRequestHandler
import json
import genanki
import io

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data)

        # Aqui você usa o genanki oficial (Python)
        my_model = genanki.Model(1607392319, 'Simple Model', fields=[{'name': 'Question'}, {'name': 'Answer'}],
            templates=[{'name': 'Card 1', 'qfmt': '{{Question}}', 'afmt': '{{Answer}}'}])
        
        my_deck = genanki.Deck(2059400110, 'AnkiXport Deck')

        for card in data:
            my_note = genanki.Note(model=my_model, fields=[card['pergunta'], card['resposta']])
            my_deck.add_note(my_note)

        # Gera o arquivo na memória
        output = io.BytesIO()
        genanki.Package(my_deck).write_to_file(output)
        
        self.send_response(200)
        self.send_header('Content-type', 'application/octet-stream')
        self.send_header('Content-Disposition', 'attachment; filename="deck.apkg"')
        self.end_headers()
        self.wfile.write(output.getvalue())
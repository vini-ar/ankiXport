import os
import re
import unicodedata

# 1. Definições
# O script assume que está um nível ACIMA da pasta json_files
DIRECTORY = 'json_files'

def slugify(filename):
    """
    Converte um nome de arquivo em um "slug" limpo e seguro para a web.
    """
    
    # Separa nome e extensão (ex: "Nome do Arquivo", ".txt")
    name, ext = os.path.splitext(filename)
    
    # Converte para minúsculas
    new_name = name.lower()
    
    # Remove a metadata de áudio (ex: " (128kbit_AAC)")
    new_name = re.sub(r'\s*\(\d+kbit_aac\)', '', new_name)
    
    # Normaliza acentos (ex: "Clasificación" -> "Clasificacion")
    try:
        new_name = unicodedata.normalize('NFD', new_name)
        new_name = new_name.encode('ascii', 'ignore').decode('utf-8')
    except Exception:
        new_name = re.sub(r'[^a-z0-9\s]', '', new_name)
    
    # Substitui a barra de fração '⁄' (U+2044) e outros por underscore
    new_name = new_name.replace('⁄', '_')
    
    # Substitui qualquer caractere que NÃO seja letra, número ou underscore por _
    new_name = re.sub(r'[^a-z0-9]+', '_', new_name)
    
    # Remove underscores duplicados (ex: "a__b" -> "a_b")
    new_name = re.sub(r'_+', '_', new_name)
    
    # Remove underscores que possam ter ficado no início ou fim
    new_name = new_name.strip('_')
    
    # Garante que não fique vazio (caso o nome fosse só "().txt")
    if not new_name:
        new_name = 'arquivo'
    
    # Retorna o novo nome com a extensão original
    return f"{new_name}{ext}"

# 3. Bloco Principal de Execução
if __name__ == "__main__":
    print(f"Iniciando verificação de nomes em TODAS as subpastas de: {DIRECTORY}\n")
    
    try:
        if not os.path.isdir(DIRECTORY):
            print(f"ERRO: A pasta '{DIRECTORY}' não foi encontrada.")
            print("Certifique-se de que este script está na pasta /ankiXport/")
            exit()
            
        files_to_rename = []
        
        # --- MUDANÇA PRINCIPAL ---
        # Usa os.walk() para percorrer todas as pastas e subpastas
        for dirpath, dirnames, filenames in os.walk(DIRECTORY):
            # Ignora pastas que começam com . (ex: .git, .DS_Store)
            dirnames[:] = [d for d in dirnames if not d.startswith('.')]
            
            for filename in filenames:
                # Ignora arquivos que não são .txt ou começam com .
                if not filename.endswith('.txt') or filename.startswith('.'):
                    continue
                    
                new_filename = slugify(filename)
                
                # Adiciona à lista apenas se o nome for mudar
                if new_filename != filename:
                    # Precisamos do caminho completo para renomear
                    old_path = os.path.join(dirpath, filename)
                    new_path = os.path.join(dirpath, new_filename)
                    files_to_rename.append((old_path, new_path, filename, new_filename))
        
        if not files_to_rename:
            print("Nenhum arquivo precisa ser renomeado. Tudo limpo!")
            exit()
            
        # Mostra o plano de renomeação
        print("Os seguintes arquivos serão renomeados:")
        for old_path, new_path, old_name, new_name in files_to_rename:
            # Mostra o caminho relativo para ficar mais legível
            relative_path = os.path.relpath(old_path, os.getcwd())
            print(f'- "{relative_path}" \n  -> "{new_name}"')
        
        # Pede confirmação
        confirm = input("\nContinuar com a renomeação? (s/n): ").strip().lower()
        
        if confirm != 's':
            print("Operação cancelada.")
            exit()

        # Segunda passagem: Renomear de fato
        print("\nRenomeando arquivos...")
        renamed_count = 0
        for old_path, new_path, old_name, new_name in files_to_rename:
            # Checagem final de segurança (evita sobrescrever)
            if os.path.exists(new_path):
                print(f'AVISO: "{new_name}" já existe na pasta. Pulando a renomeação de "{old_name}".')
            else:
                os.rename(old_path, new_path)
                renamed_count += 1
                
        print(f"\nConcluído! {renamed_count} arquivos foram renomeados.")

    except Exception as e:
        print(f"Ocorreu um erro inesperado: {e}")
import os
import re
import unicodedata

# 1. Definições
# O script assume que está um nível ACIMA da pasta json_files
DIRECTORY = 'json_files'

def slugify(filename):
    """
    Converte um nome de arquivo em um "slug" limpo e seguro para a web.
    Ex: "Clasificación... (128kbit_AAC).txt" -> "clasificacion_... .txt"
    """
    
    # Separa nome e extensão (ex: "Nome do Arquivo", ".txt")
    name, ext = os.path.splitext(filename)
    
    # Converte para minúsculas
    new_name = name.lower()
    
    # Remove a metadata de áudio (ex: " (128kbit_AAC)")
    new_name = re.sub(r'\s*\(\d+kbit_aac\)', '', new_name)
    
    # Normaliza acentos (ex: "Clasificación" -> "Clasificacion")
    # Tenta o método 'ignore' do ASCII que é mais simples e robusto
    try:
        new_name = unicodedata.normalize('NFD', new_name)
        new_name = new_name.encode('ascii', 'ignore').decode('utf-8')
    except Exception:
        # Fallback para caso algo dê muito errado
        new_name = re.sub(r'[^a-z0-9\s]', '', new_name)
    
    # Substitui a barra de fração '⁄' (U+2044) e outros por underscore
    new_name = new_name.replace('⁄', '_')
    
    # Substitui qualquer caractere que NÃO seja letra, número ou underscore por _
    # Isso pega espaços, pontos, hífens, etc.
    new_name = re.sub(r'[^a-z0-9]+', '_', new_name)
    
    # Remove underscores duplicados (ex: "a__b" -> "a_b")
    new_name = re.sub(r'_+', '_', new_name)
    
    # Remove underscores que possam ter ficado no início ou fim
    new_name = new_name.strip('_')
    
    # Retorna o novo nome com a extensão original
    return f"{new_name}{ext}"

# 3. Bloco Principal de Execução
if __name__ == "__main__":
    print(f"Iniciando verificação de nomes na pasta: {DIRECTORY}\n")
    
    try:
        # Verifica se o diretório existe
        if not os.path.isdir(DIRECTORY):
            print(f"ERRO: A pasta '{DIRECTORY}' não foi encontrada.")
            print("Certifique-se de que este script está na pasta /ankiXport/")
            exit()
            
        files_to_rename = []
        
        # Primeira passagem: Coletar todos os arquivos e seus novos nomes
        for filename in os.listdir(DIRECTORY):
            # Ignora arquivos que não são .txt
            if not filename.endswith('.txt'):
                continue
                
            new_filename = slugify(filename)
            
            # Adiciona à lista apenas se o nome for mudar
            if new_filename != filename:
                files_to_rename.append((filename, new_filename))
        
        if not files_to_rename:
            print("Nenhum arquivo precisa ser renomeado. Tudo limpo!")
            exit()
            
        # Mostra o plano de renomeação
        print("Os seguintes arquivos serão renomeados:")
        for old, new in files_to_rename:
            print(f'- "{old}" \n  -> "{new}"')
        
        # Pede confirmação
        confirm = input("\nContinuar com a renomeação? (s/n): ").strip().lower()
        
        if confirm != 's':
            print("Operação cancelada.")
            exit()

        # Segunda passagem: Renomear de fato
        print("\nRenomeando arquivos...")
        renamed_count = 0
        for old_filename, new_filename in files_to_rename:
            old_path = os.path.join(DIRECTORY, old_filename)
            new_path = os.path.join(DIRECTORY, new_filename)
            
            # Checagem final de segurança (evita sobrescrever)
            if os.path.exists(new_path):
                print(f'AVISO: "{new_filename}" já existe. Pulando a renomeação de "{old_filename}".')
            else:
                os.rename(old_path, new_path)
                renamed_count += 1
                
        print(f"\nConcluído! {renamed_count} arquivos foram renomeados.")

    except Exception as e:
        print(f"Ocorreu um erro inesperado: {e}")
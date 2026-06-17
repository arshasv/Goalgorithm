import os
import re

def update_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # Replace old brand names
    content = re.sub(r'FIFA Elite Analytics', 'GOALGORITHM', content, flags=re.IGNORECASE)
    content = re.sub(r'FIFA Elite', 'GOALGORITHM', content, flags=re.IGNORECASE)
    content = re.sub(r'FIFA Challenge Scoring System', 'GOALGORITHM Scoring System', content, flags=re.IGNORECASE)
    content = re.sub(r'FIFA Executive', 'GOALGORITHM Executive', content, flags=re.IGNORECASE)
    content = re.sub(r'FIFA Night Stadium', 'GOALGORITHM Night Stadium', content, flags=re.IGNORECASE)
    
    # Specific replacements to keep formatting intact
    content = re.sub(r'FIFA-scoring-system', 'fifa-scoring-system', content)
    
    if content != original:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {path}")

for root, dirs, files in os.walk('docs'):
    for file in files:
        if file.endswith('.md'):
            update_file(os.path.join(root, file))

# Update README and WORKFLOW
update_file('README.md')
update_file('WORKFLOW.md')


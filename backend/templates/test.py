import json
from jinja2 import Environment, FileSystemLoader

def generate_html_report(json_data, template_path, output_path):
    env = Environment(loader=FileSystemLoader(template_path))
    template = env.get_template('report-seo.html')
    html_content = template.render(json_data)
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html_content)
    print(f"Rapport généré : {output_path}")

if __name__ == "__main__":
    with open('seo.json', 'r', encoding='utf-8') as file:
        data = json.load(file)
    template_folder = '.'  
    generate_html_report(data, template_folder, 'rapport_seo.html')

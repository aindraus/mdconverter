import os
import io
import re
from flask import Flask, render_template, request, send_file, jsonify, make_response
import markdown
from markdown.extensions.codehilite import CodeHiliteExtension
from markdown.extensions.fenced_code import FencedCodeExtension
from markdown.extensions.tables import TableExtension
from flask_wtf.csrf import CSRFProtect
from flask_wtf import FlaskForm
from xhtml2pdf import pisa  # Import pisa from xhtml2pdf

app = Flask(__name__)
app.config['SECRET_KEY'] = os.urandom(24)
csrf = CSRFProtect(app)

# Create a simple form class for CSRF protection
class CSRFForm(FlaskForm):
    pass

def convert_markdown_to_html(md_text):
    """Convert markdown text to HTML with syntax highlighting."""
    extensions = [
        CodeHiliteExtension(css_class='highlight', guess_lang=True),
        FencedCodeExtension(),
        TableExtension(),
        'pymdownx.superfences',
        'pymdownx.highlight',
        'pymdownx.tasklist',
        'pymdownx.emoji',
        'pymdownx.inlinehilite',
        'pymdownx.magiclink',
        'pymdownx.smartsymbols',
        'pymdownx.tilde',
        'markdown.extensions.footnotes',
        'markdown.extensions.attr_list',
        'markdown.extensions.def_list',
        'markdown.extensions.abbr',
        'markdown.extensions.admonition',
        'markdown.extensions.meta',
        'markdown.extensions.toc',
    ]
    
    html = markdown.markdown(md_text, extensions=extensions)
    return html

def convert_html_to_pdf(html_content):
    """Convert HTML content to PDF using xhtml2pdf."""
    # Create a file-like buffer to receive PDF data
    pdf_buffer = io.BytesIO()
    
    # Extract title from the first heading if available
    title = "Converted PDF"
    h1_match = re.search(r'<h1[^>]*>(.*?)</h1>', html_content, re.DOTALL)
    if h1_match:
        title = re.sub(r'<[^>]+>', '', h1_match.group(1)).strip()
    elif re.search(r'<h2[^>]*>(.*?)</h2>', html_content, re.DOTALL):
        h2_match = re.search(r'<h2[^>]*>(.*?)</h2>', html_content, re.DOTALL)
        title = re.sub(r'<[^>]+>', '', h2_match.group(1)).strip()
    
    # Add CSS for styling
    styled_html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>{title}</title>
        <style>
            @page {{
                size: a4 portrait;
                margin: 2cm 1.5cm;
                @frame header {{
                    -pdf-frame-content: headerContent;
                    top: 0.5cm;
                    margin-left: 1cm;
                    margin-right: 1cm;
                    height: 1cm;
                }}
                @frame footer {{
                    -pdf-frame-content: footerContent;
                    bottom: 0.5cm;
                    margin-left: 1cm;
                    margin-right: 1cm;
                    height: 0.5cm;
                }}
            }}
            
            body {{
                font-family: Helvetica, Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                margin: 0;
                padding: 0;
                font-size: 11pt;
            }}
            
            h1, h2, h3, h4, h5, h6 {{
                color: #2c3e50;
                margin-top: 1.5em;
                margin-bottom: 0.5em;
                line-height: 1.2;
                page-break-after: avoid;
            }}
            
            h1 {{ font-size: 2em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; margin-top: 0; }}
            h2 {{ font-size: 1.6em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; margin-top: 1.5em; }}
            h3 {{ font-size: 1.3em; margin-top: 1.3em; }}
            h4 {{ font-size: 1.1em; margin-top: 1.2em; }}
            h5 {{ font-size: 1em; margin-top: 1.1em; }}
            h6 {{ font-size: 0.9em; margin-top: 1em; }}
            
            p {{
                margin-top: 0.5em;
                margin-bottom: 0.8em;
                text-align: justify;
            }}
            
            ul, ol {{
                margin-top: 0.5em;
                margin-bottom: 1em;
                padding-left: 2em;
            }}
            
            li {{
                margin-bottom: 0.3em;
            }}
            
            a {{
                color: #3498db;
                text-decoration: none;
            }}
            
            blockquote {{
                border-left: 4px solid #ddd;
                padding: 0.5em 1em;
                color: #777;
                margin: 1em 0;
                background-color: #f8f8f8;
            }}
            
            code {{
                font-family: Courier, monospace;
                background-color: #282c34 !important;
                color: #abb2bf !important;
                padding: 0.2em 0.4em;
                border-radius: 3px;
                font-size: 0.9em;
                white-space: pre-wrap;
            }}
            
            pre {{
                background-color: #282c34 !important;
                color: #abb2bf !important;
                padding: 1em;
                border-radius: 5px;
                overflow-x: auto;
                margin: 1em 0;
                white-space: pre-wrap;
                page-break-inside: avoid;
            }}
            
            pre code {{
                background-color: #282c34 !important;
                color: #abb2bf !important;
                padding: 0;
                border-radius: 0;
                font-size: 0.9em;
            }}
            
            /* Force all code spans to have proper background and text color */
            .highlight * {{
                background-color: #282c34 !important;
                color: #abb2bf !important;
            }}
            
            /* Ensure code spans inside pre have proper styling */
            pre * {{
                background-color: #282c34 !important;
            }}
            
            table {{
                border-collapse: collapse;
                width: 100%;
                margin: 1.5em 0;
                page-break-inside: avoid;
            }}
            
            table, th, td {{
                border: 1px solid #ddd;
            }}
            
            th, td {{
                padding: 8px 12px;
                text-align: left;
            }}
            
            th {{
                background-color: #f5f5f5;
                font-weight: bold;
            }}
            
            tr:nth-child(even) {{
                background-color: #f9f9f9;
            }}
            
            img {{
                max-width: 100%;
                height: auto;
                display: block;
                margin: 1.5em auto;
                page-break-inside: avoid;
            }}
            
            hr {{
                border: 0;
                border-top: 1px solid #eee;
                margin: 2em 0;
            }}
            
            #headerContent {{
                text-align: right;
                font-size: 9pt;
                color: #777;
            }}
            
            #footerContent {{
                text-align: center;
                font-size: 9pt;
                color: #777;
            }}
            
            /* Syntax highlighting styles - One Dark theme */
            .highlight {{ background-color: #282c34 !important; color: #abb2bf !important; }}
            .highlight .hll {{ background-color: #282c34 !important; }}
            .highlight .c {{ color: #5c6370 !important; font-style: italic !important; background-color: #282c34 !important; }} /* Comment */
            .highlight .err {{ color: #960050 !important; background-color: #282c34 !important; }} /* Error */
            .highlight .k {{ color: #c678dd !important; font-weight: bold !important; background-color: #282c34 !important; }} /* Keyword */
            .highlight .o {{ color: #c678dd !important; background-color: #282c34 !important; }} /* Operator */
            .highlight .ch {{ color: #5c6370 !important; font-style: italic !important; background-color: #282c34 !important; }} /* Comment.Hashbang */
            .highlight .cm {{ color: #5c6370 !important; font-style: italic !important; background-color: #282c34 !important; }} /* Comment.Multiline */
            .highlight .cp {{ color: #5c6370 !important; background-color: #282c34 !important; }} /* Comment.Preproc */
            .highlight .cpf {{ color: #5c6370 !important; font-style: italic !important; background-color: #282c34 !important; }} /* Comment.PreprocFile */
            .highlight .c1 {{ color: #5c6370 !important; font-style: italic !important; background-color: #282c34 !important; }} /* Comment.Single */
            .highlight .cs {{ color: #5c6370 !important; font-style: italic !important; background-color: #282c34 !important; }} /* Comment.Special */
            .highlight .gd {{ color: #e06c75 !important; background-color: #282c34 !important; }} /* Generic.Deleted */
            .highlight .ge {{ font-style: italic !important; background-color: #282c34 !important; }} /* Generic.Emph */
            .highlight .gr {{ color: #e06c75 !important; background-color: #282c34 !important; }} /* Generic.Error */
            .highlight .gh {{ color: #61afef !important; font-weight: bold !important; background-color: #282c34 !important; }} /* Generic.Heading */
            .highlight .gi {{ color: #98c379 !important; background-color: #282c34 !important; }} /* Generic.Inserted */
            .highlight .go {{ color: #abb2bf !important; background-color: #282c34 !important; }} /* Generic.Output */
            .highlight .gp {{ color: #61afef !important; font-weight: bold !important; background-color: #282c34 !important; }} /* Generic.Prompt */
            .highlight .gs {{ font-weight: bold !important; background-color: #282c34 !important; }} /* Generic.Strong */
            .highlight .gu {{ color: #61afef !important; font-weight: bold !important; background-color: #282c34 !important; }} /* Generic.Subheading */
            .highlight .gt {{ color: #e06c75 !important; background-color: #282c34 !important; }} /* Generic.Traceback */
            .highlight .kc {{ color: #c678dd !important; font-weight: bold !important; background-color: #282c34 !important; }} /* Keyword.Constant */
            .highlight .kd {{ color: #c678dd !important; font-weight: bold !important; background-color: #282c34 !important; }} /* Keyword.Declaration */
            .highlight .kn {{ color: #c678dd !important; font-weight: bold !important; background-color: #282c34 !important; }} /* Keyword.Namespace */
            .highlight .kp {{ color: #c678dd !important; background-color: #282c34 !important; }} /* Keyword.Pseudo */
            .highlight .kr {{ color: #c678dd !important; font-weight: bold !important; background-color: #282c34 !important; }} /* Keyword.Reserved */
            .highlight .kt {{ color: #c678dd !important; background-color: #282c34 !important; }} /* Keyword.Type */
            .highlight .m {{ color: #d19a66 !important; background-color: #282c34 !important; }} /* Literal.Number */
            .highlight .s {{ color: #98c379 !important; background-color: #282c34 !important; }} /* Literal.String */
            .highlight .na {{ color: #d19a66 !important; background-color: #282c34 !important; }} /* Name.Attribute */
            .highlight .nb {{ color: #e5c07b !important; background-color: #282c34 !important; }} /* Name.Builtin */
            .highlight .nc {{ color: #e5c07b !important; font-weight: bold !important; background-color: #282c34 !important; }} /* Name.Class */
            .highlight .no {{ color: #e5c07b !important; background-color: #282c34 !important; }} /* Name.Constant */
            .highlight .nd {{ color: #e5c07b !important; background-color: #282c34 !important; }} /* Name.Decorator */
            .highlight .ni {{ color: #e5c07b !important; font-weight: bold !important; background-color: #282c34 !important; }} /* Name.Entity */
            .highlight .ne {{ color: #e06c75 !important; font-weight: bold !important; background-color: #282c34 !important; }} /* Name.Exception */
            .highlight .nf {{ color: #61afef !important; background-color: #282c34 !important; }} /* Name.Function */
            .highlight .nl {{ color: #e5c07b !important; background-color: #282c34 !important; }} /* Name.Label */
            .highlight .nn {{ color: #e5c07b !important; font-weight: bold !important; background-color: #282c34 !important; }} /* Name.Namespace */
            .highlight .nt {{ color: #e06c75 !important; font-weight: bold !important; background-color: #282c34 !important; }} /* Name.Tag */
            .highlight .nv {{ color: #e5c07b !important; background-color: #282c34 !important; }} /* Name.Variable */
            .highlight .ow {{ color: #c678dd !important; font-weight: bold !important; background-color: #282c34 !important; }} /* Operator.Word */
            .highlight .w {{ color: #abb2bf !important; background-color: #282c34 !important; }} /* Text.Whitespace */
            .highlight .mb {{ color: #d19a66 !important; background-color: #282c34 !important; }} /* Literal.Number.Bin */
            .highlight .mf {{ color: #d19a66 !important; background-color: #282c34 !important; }} /* Literal.Number.Float */
            .highlight .mh {{ color: #d19a66 !important; background-color: #282c34 !important; }} /* Literal.Number.Hex */
            .highlight .mi {{ color: #d19a66 !important; background-color: #282c34 !important; }} /* Literal.Number.Integer */
            .highlight .mo {{ color: #d19a66 !important; background-color: #282c34 !important; }} /* Literal.Number.Oct */
            .highlight .sa {{ color: #98c379 !important; background-color: #282c34 !important; }} /* Literal.String.Affix */
            .highlight .sb {{ color: #98c379 !important; background-color: #282c34 !important; }} /* Literal.String.Backtick */
            .highlight .sc {{ color: #98c379 !important; background-color: #282c34 !important; }} /* Literal.String.Char */
            .highlight .dl {{ color: #98c379 !important; background-color: #282c34 !important; }} /* Literal.String.Delimiter */
            .highlight .sd {{ color: #98c379 !important; font-style: italic !important; background-color: #282c34 !important; }} /* Literal.String.Doc */
            .highlight .s2 {{ color: #98c379 !important; background-color: #282c34 !important; }} /* Literal.String.Double */
            .highlight .se {{ color: #98c379 !important; font-weight: bold !important; background-color: #282c34 !important; }} /* Literal.String.Escape */
            .highlight .sh {{ color: #98c379 !important; background-color: #282c34 !important; }} /* Literal.String.Heredoc */
            .highlight .si {{ color: #98c379 !important; font-weight: bold !important; background-color: #282c34 !important; }} /* Literal.String.Interpol */
            .highlight .sx {{ color: #98c379 !important; background-color: #282c34 !important; }} /* Literal.String.Other */
            .highlight .sr {{ color: #98c379 !important; background-color: #282c34 !important; }} /* Literal.String.Regex */
            .highlight .s1 {{ color: #98c379 !important; background-color: #282c34 !important; }} /* Literal.String.Single */
            .highlight .ss {{ color: #98c379 !important; background-color: #282c34 !important; }} /* Literal.String.Symbol */
            .highlight .bp {{ color: #e5c07b !important; background-color: #282c34 !important; }} /* Name.Builtin.Pseudo */
            .highlight .fm {{ color: #61afef !important; background-color: #282c34 !important; }} /* Name.Function.Magic */
            .highlight .vc {{ color: #e5c07b !important; background-color: #282c34 !important; }} /* Name.Variable.Class */
            .highlight .vg {{ color: #e5c07b !important; background-color: #282c34 !important; }} /* Name.Variable.Global */
            .highlight .vi {{ color: #e5c07b !important; background-color: #282c34 !important; }} /* Name.Variable.Instance */
            .highlight .vm {{ color: #e5c07b !important; background-color: #282c34 !important; }} /* Name.Variable.Magic */
            .highlight .il {{ color: #d19a66 !important; background-color: #282c34 !important; }} /* Literal.Number.Integer.Long */
        </style>
    </head>
    <body>
        <div id="headerContent">{title}</div>
        {html_content}
        <div id="footerContent" style="text-align: center; font-size: 9pt; color: #777;">
            Page <pdf:pagenumber> of <pdf:pagecount>
        </div>
    </body>
    </html>
    """
    
    # Convert HTML to PDF
    pisa_status = pisa.CreatePDF(
        styled_html,
        dest=pdf_buffer
    )
    
    # Return PDF buffer if successful
    if pisa_status.err:
        return None
    
    pdf_buffer.seek(0)
    return pdf_buffer

@app.route('/')
def index():
    """Render the main page."""
    form = CSRFForm()
    return render_template('index.html', form=form)

@app.route('/convert', methods=['POST'])
def convert():
    """Convert markdown to HTML or PDF."""
    markdown_text = request.form.get('markdown_text', '')
    output_format = request.form.get('output_format', 'html')
    
    # Convert markdown to HTML
    html_content = convert_markdown_to_html(markdown_text)
    
    if output_format == 'pdf':
        # Convert HTML to PDF
        pdf_buffer = convert_html_to_pdf(html_content)
        if pdf_buffer:
            # Extract title for the filename
            title = "converted"
            h1_match = re.search(r'<h1[^>]*>(.*?)</h1>', html_content, re.DOTALL)
            if h1_match:
                # Clean the title for use in filename
                clean_title = re.sub(r'<[^>]+>', '', h1_match.group(1))
                clean_title = re.sub(r'[^\w\s-]', '', clean_title).strip().lower()
                clean_title = re.sub(r'[-\s]+', '-', clean_title)
                if clean_title:
                    title = clean_title
            
            response = make_response(send_file(
                pdf_buffer,
                mimetype='application/pdf',
                as_attachment=True,
                download_name=f"{title}.pdf"
            ))
            return response
        else:
            return jsonify({'error': 'PDF conversion failed'}), 500
    else:
        # Return HTML
        return jsonify({'html': html_content})

@app.route('/preview', methods=['POST'])
def preview():
    """Generate a preview of the markdown as HTML."""
    markdown_text = request.form.get('markdown_text', '')
    html_content = convert_markdown_to_html(markdown_text)
    return jsonify({'html': html_content})

if __name__ == '__main__':
    app.run(debug=True, port=5001) 
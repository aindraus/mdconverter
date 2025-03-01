# Markdown to PDF/HTML Converter

A web application that converts Markdown to styled PDF or HTML documents. The styling includes proper formatting for headers, body text, code blocks with syntax highlighting, and quotes.

## Features

- Convert Markdown to PDF
- Convert Markdown to HTML
- Syntax highlighting for code blocks
- Proper styling for headers, paragraphs, and quotes
- Live preview of the converted document

## Setup

1. Clone this repository
2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
3. Run the application:
   ```
   python app.py
   ```
4. Open your browser and navigate to `http://localhost:5000`

## Dependencies

- Flask: Web framework
- Markdown: Markdown parsing
- Pygments: Syntax highlighting
- WeasyPrint: PDF generation
- PyMdown Extensions: Extended Markdown features

## Usage

1. Enter or paste your Markdown content in the text area
2. Choose the output format (PDF or HTML)
3. Click "Convert" to generate the document
4. Download or view the generated document 
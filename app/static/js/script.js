document.addEventListener('DOMContentLoaded', function() {
    const markdownInput = document.getElementById('markdown-input');
    const previewContent = document.getElementById('preview-content');
    const previewBtn = document.getElementById('preview-btn');
    const convertForm = document.getElementById('convert-form');
    const markdownText = document.getElementById('markdown-text');
    
    // Sample markdown to show on page load
    const sampleMarkdown = `# Markdown to PDF/HTML Converter

## Features

This converter supports:

- **Headers** (like the ones above)
- **Bold** and *italic* text
- Lists (numbered and bulleted)
- [Links](https://example.com)
- Images
- Blockquotes
- Code blocks with syntax highlighting

> This is a blockquote that demonstrates the styling.

### Code Example

\`\`\`python
def hello_world():
    """Print a greeting message."""
    print("Hello, world!")
    
    # This is a comment
    for i in range(5):
        print(f"Count: {i}")
        
hello_world()
\`\`\`

\`\`\`javascript
// JavaScript example
function calculateSum(a, b) {
    return a + b;
}

const result = calculateSum(10, 20);
console.log(\`The sum is \${result}\`);
\`\`\`

### Table Example

| Name | Age | Occupation |
|------|-----|------------|
| John | 30  | Developer  |
| Jane | 25  | Designer   |
| Bob  | 40  | Manager    |

`;

    // Set sample markdown on load
    markdownInput.value = sampleMarkdown;
    
    // Preview button click handler
    previewBtn.addEventListener('click', function() {
        updatePreview();
    });
    
    // Form submit handler
    convertForm.addEventListener('submit', function(e) {
        // For HTML output, prevent default form submission and handle with AJAX
        if (document.querySelector('input[name="output_format"]:checked').value === 'html') {
            e.preventDefault();
            convertToHTML();
        } else {
            // For PDF, update the hidden input and let the form submit normally
            markdownText.value = markdownInput.value;
        }
    });
    
    // Update preview on page load
    updatePreview();
    
    // Function to update the preview
    function updatePreview() {
        const markdown = markdownInput.value;
        markdownText.value = markdown;
        
        // Send AJAX request to get HTML preview
        fetch('/preview', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-CSRFToken': document.querySelector('input[name="csrf_token"]').value
            },
            body: new URLSearchParams({
                'markdown_text': markdown
            })
        })
        .then(response => response.json())
        .then(data => {
            previewContent.innerHTML = data.html;
        })
        .catch(error => {
            console.error('Error:', error);
            previewContent.innerHTML = '<p class="error">Error generating preview</p>';
        });
    }
    
    // Function to convert to HTML and download
    function convertToHTML() {
        const markdown = markdownInput.value;
        
        fetch('/convert', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-CSRFToken': document.querySelector('input[name="csrf_token"]').value
            },
            body: new URLSearchParams({
                'markdown_text': markdown,
                'output_format': 'html'
            })
        })
        .then(response => response.json())
        .then(data => {
            // Create a complete HTML document
            const completeHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Converted Markdown</title>
    <style>
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
        }
        h1, h2, h3, h4, h5, h6 {
            color: #2c3e50;
            margin-top: 1.5em;
            margin-bottom: 0.5em;
        }
        h1 { font-size: 2.2em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
        h2 { font-size: 1.8em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
        h3 { font-size: 1.5em; }
        h4 { font-size: 1.3em; }
        h5 { font-size: 1.2em; }
        h6 { font-size: 1.1em; }
        
        p, ul, ol {
            margin-bottom: 1em;
        }
        
        a {
            color: #3498db;
            text-decoration: none;
        }
        
        blockquote {
            border-left: 4px solid #ddd;
            padding-left: 1em;
            color: #777;
            margin-left: 0;
            margin-right: 0;
        }
        
        code {
            font-family: 'Courier New', Courier, monospace;
            background-color: #f5f5f5;
            padding: 0.2em 0.4em;
            border-radius: 3px;
            font-size: 0.9em;
        }
        
        pre {
            background-color: #f5f5f5;
            padding: 1em;
            border-radius: 5px;
            overflow-x: auto;
            margin: 1em 0;
        }
        
        pre code {
            background-color: transparent;
            padding: 0;
            border-radius: 0;
        }
        
        table {
            border-collapse: collapse;
            width: 100%;
            margin: 1em 0;
        }
        
        table, th, td {
            border: 1px solid #ddd;
        }
        
        th, td {
            padding: 8px 12px;
            text-align: left;
        }
        
        th {
            background-color: #f5f5f5;
        }
        
        img {
            max-width: 100%;
            height: auto;
        }
        
        hr {
            border: 0;
            border-top: 1px solid #eee;
            margin: 2em 0;
        }
        ${document.querySelector('link[href*="pygments.css"]').outerHTML}
    </style>
</head>
<body>
    ${data.html}
</body>
</html>
            `;
            
            // Create a blob and download link
            const blob = new Blob([completeHTML], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'converted.html';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error converting to HTML');
        });
    }
    
    // Add input event listener for real-time preview (debounced)
    let debounceTimer;
    markdownInput.addEventListener('input', function() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(updatePreview, 500);
    });
}); 
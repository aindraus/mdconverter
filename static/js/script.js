document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const markdownInput = document.getElementById('markdown-input');
    const previewContent = document.getElementById('preview-content');
    const previewBtn = document.getElementById('preview-btn');
    const convertForm = document.getElementById('convert-form');
    const markdownText = document.getElementById('markdown-text');
    
    // Sample markdown to show on page load
    const sampleMarkdown = `# Markdown to HTML/PDF Converter

## Features

This converter supports:

- **Headers** (like the ones above)
- **Bold** and *italic* text
- Lists (numbered and bulleted)
- [Links](https://example.com)
- Images
- Blockquotes
- Code blocks with syntax highlighting
- Export to HTML or PDF

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
    
    // Add loading indicator
    function showLoading(element) {
        element.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
    }
    
    // Preview button click handler
    previewBtn.addEventListener('click', function() {
        showLoading(previewContent);
        updatePreview();
    });
    
    // Form submit handler
    convertForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const outputFormat = document.querySelector('input[name="output_format"]:checked').value;
        
        // Show loading state on button
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Converting...';
        submitBtn.disabled = true;
        
        if (outputFormat === 'html') {
            convertToHTML().finally(() => {
                // Reset button state
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            });
        } else if (outputFormat === 'pdf') {
            convertToPDF();
            // Reset button after a delay since we're doing a form submission
            setTimeout(() => {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }, 2000);
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
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            previewContent.innerHTML = data.html;
            
            // Add copy buttons to code blocks
            addCopyButtonsToCodeBlocks();
        })
        .catch(error => {
            console.error('Error:', error);
            previewContent.innerHTML = `<p class="error"><i class="fas fa-exclamation-circle"></i> Error generating preview: ${error.message}</p>`;
        });
    }
    
    // Add copy buttons to code blocks
    function addCopyButtonsToCodeBlocks() {
        const codeBlocks = previewContent.querySelectorAll('pre');
        
        codeBlocks.forEach(block => {
            // Check if button already exists
            if (block.querySelector('.copy-btn')) return;
            
            const copyBtn = document.createElement('button');
            copyBtn.className = 'copy-btn';
            copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
            copyBtn.title = 'Copy to clipboard';
            
            // Position the button
            block.style.position = 'relative';
            copyBtn.style.position = 'absolute';
            copyBtn.style.top = '0.5rem';
            copyBtn.style.right = '0.5rem';
            copyBtn.style.padding = '0.25rem 0.5rem';
            copyBtn.style.background = 'rgba(255, 255, 255, 0.1)';
            copyBtn.style.border = 'none';
            copyBtn.style.borderRadius = '4px';
            copyBtn.style.color = '#abb2bf';
            copyBtn.style.cursor = 'pointer';
            
            copyBtn.addEventListener('click', () => {
                const code = block.querySelector('code').innerText;
                navigator.clipboard.writeText(code).then(() => {
                    copyBtn.innerHTML = '<i class="fas fa-check"></i>';
                    setTimeout(() => {
                        copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
                    }, 2000);
                }).catch(err => {
                    console.error('Failed to copy: ', err);
                    copyBtn.innerHTML = '<i class="fas fa-times"></i>';
                    setTimeout(() => {
                        copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
                    }, 2000);
                });
            });
            
            block.appendChild(copyBtn);
        });
    }
    
    // Function to convert to HTML and download
    function convertToHTML() {
        const markdown = markdownInput.value;
        
        return fetch('/convert', {
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
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
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
            font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
            line-height: 1.6;
            color: #1e293b;
            margin: 0;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
        }
        h1, h2, h3, h4, h5, h6 {
            color: #0f172a;
            margin-top: 1.5em;
            margin-bottom: 0.5em;
            font-weight: 600;
        }
        h1 { font-size: 2.2em; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.3em; }
        h2 { font-size: 1.8em; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.3em; }
        h3 { font-size: 1.5em; }
        h4 { font-size: 1.3em; }
        h5 { font-size: 1.2em; }
        h6 { font-size: 1.1em; }
        
        p, ul, ol {
            margin-bottom: 1em;
        }
        
        a {
            color: #4a6cf7;
            text-decoration: none;
        }
        
        a:hover {
            text-decoration: underline;
        }
        
        blockquote {
            border-left: 4px solid #4a6cf7;
            padding: 0.8em 1em;
            color: #475569;
            background-color: #f1f5f9;
            margin: 1em 0;
            border-radius: 0 8px 8px 0;
        }
        
        code {
            font-family: 'Fira Code', 'Courier New', monospace;
            background-color: #282c34;
            color: #abb2bf;
            padding: 0.2em 0.4em;
            border-radius: 4px;
            font-size: 0.9em;
        }
        
        pre {
            background-color: #282c34;
            padding: 1em;
            border-radius: 8px;
            overflow-x: auto;
            margin: 1em 0;
            position: relative;
        }
        
        pre code {
            background-color: transparent;
            padding: 0;
            border-radius: 0;
            color: #abb2bf;
        }
        
        table {
            border-collapse: collapse;
            width: 100%;
            margin: 1em 0;
            border-radius: 8px;
            overflow: hidden;
        }
        
        table, th, td {
            border: 1px solid #e2e8f0;
        }
        
        th, td {
            padding: 0.75rem 1rem;
            text-align: left;
        }
        
        th {
            background-color: #f1f5f9;
            font-weight: 600;
        }
        
        tr:nth-child(even) {
            background-color: #f8fafc;
        }
        
        img {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        
        hr {
            border: 0;
            border-top: 1px solid #e2e8f0;
            margin: 2em 0;
        }
        
        /* Syntax highlighting styles - One Dark theme */
        .highlight { background-color: #282c34; color: #abb2bf; }
        .highlight .hll { background-color: #282c34 }
        .highlight .c { color: #5c6370; font-style: italic } /* Comment */
        .highlight .err { color: #960050; background-color: #1e0010 } /* Error */
        .highlight .k { color: #c678dd; font-weight: bold } /* Keyword */
        .highlight .o { color: #c678dd } /* Operator */
        .highlight .ch { color: #5c6370; font-style: italic } /* Comment.Hashbang */
        .highlight .cm { color: #5c6370; font-style: italic } /* Comment.Multiline */
        .highlight .cp { color: #5c6370 } /* Comment.Preproc */
        .highlight .cpf { color: #5c6370; font-style: italic } /* Comment.PreprocFile */
        .highlight .c1 { color: #5c6370; font-style: italic } /* Comment.Single */
        .highlight .cs { color: #5c6370; font-style: italic } /* Comment.Special */
        .highlight .gd { color: #e06c75 } /* Generic.Deleted */
        .highlight .ge { font-style: italic } /* Generic.Emph */
        .highlight .gr { color: #e06c75 } /* Generic.Error */
        .highlight .gh { color: #61afef; font-weight: bold } /* Generic.Heading */
        .highlight .gi { color: #98c379 } /* Generic.Inserted */
        .highlight .go { color: #abb2bf } /* Generic.Output */
        .highlight .gp { color: #61afef; font-weight: bold } /* Generic.Prompt */
        .highlight .gs { font-weight: bold } /* Generic.Strong */
        .highlight .gu { color: #61afef; font-weight: bold } /* Generic.Subheading */
        .highlight .gt { color: #e06c75 } /* Generic.Traceback */
        .highlight .kc { color: #c678dd; font-weight: bold } /* Keyword.Constant */
        .highlight .kd { color: #c678dd; font-weight: bold } /* Keyword.Declaration */
        .highlight .kn { color: #c678dd; font-weight: bold } /* Keyword.Namespace */
        .highlight .kp { color: #c678dd } /* Keyword.Pseudo */
        .highlight .kr { color: #c678dd; font-weight: bold } /* Keyword.Reserved */
        .highlight .kt { color: #c678dd } /* Keyword.Type */
        .highlight .m { color: #d19a66 } /* Literal.Number */
        .highlight .s { color: #98c379 } /* Literal.String */
        .highlight .na { color: #d19a66 } /* Name.Attribute */
        .highlight .nb { color: #e5c07b } /* Name.Builtin */
        .highlight .nc { color: #e5c07b; font-weight: bold } /* Name.Class */
        .highlight .no { color: #e5c07b } /* Name.Constant */
        .highlight .nd { color: #e5c07b } /* Name.Decorator */
        .highlight .ni { color: #e5c07b; font-weight: bold } /* Name.Entity */
        .highlight .ne { color: #e06c75; font-weight: bold } /* Name.Exception */
        .highlight .nf { color: #61afef } /* Name.Function */
        .highlight .nl { color: #e5c07b } /* Name.Label */
        .highlight .nn { color: #e5c07b; font-weight: bold } /* Name.Namespace */
        .highlight .nt { color: #e06c75; font-weight: bold } /* Name.Tag */
        .highlight .nv { color: #e5c07b } /* Name.Variable */
        .highlight .ow { color: #c678dd; font-weight: bold } /* Operator.Word */
        .highlight .w { color: #abb2bf } /* Text.Whitespace */
        .highlight .mb { color: #d19a66 } /* Literal.Number.Bin */
        .highlight .mf { color: #d19a66 } /* Literal.Number.Float */
        .highlight .mh { color: #d19a66 } /* Literal.Number.Hex */
        .highlight .mi { color: #d19a66 } /* Literal.Number.Integer */
        .highlight .mo { color: #d19a66 } /* Literal.Number.Oct */
        .highlight .sa { color: #98c379 } /* Literal.String.Affix */
        .highlight .sb { color: #98c379 } /* Literal.String.Backtick */
        .highlight .sc { color: #98c379 } /* Literal.String.Char */
        .highlight .dl { color: #98c379 } /* Literal.String.Delimiter */
        .highlight .sd { color: #98c379; font-style: italic } /* Literal.String.Doc */
        .highlight .s2 { color: #98c379 } /* Literal.String.Double */
        .highlight .se { color: #98c379; font-weight: bold } /* Literal.String.Escape */
        .highlight .sh { color: #98c379 } /* Literal.String.Heredoc */
        .highlight .si { color: #98c379; font-weight: bold } /* Literal.String.Interpol */
        .highlight .sx { color: #98c379 } /* Literal.String.Other */
        .highlight .sr { color: #98c379 } /* Literal.String.Regex */
        .highlight .s1 { color: #98c379 } /* Literal.String.Single */
        .highlight .ss { color: #98c379 } /* Literal.String.Symbol */
        .highlight .bp { color: #e5c07b } /* Name.Builtin.Pseudo */
        .highlight .fm { color: #61afef } /* Name.Function.Magic */
        .highlight .vc { color: #e5c07b } /* Name.Variable.Class */
        .highlight .vg { color: #e5c07b } /* Name.Variable.Global */
        .highlight .vi { color: #e5c07b } /* Name.Variable.Instance */
        .highlight .vm { color: #e5c07b } /* Name.Variable.Magic */
        .highlight .il { color: #d19a66 } /* Literal.Number.Integer.Long */
        ${document.querySelector('link[href*="pygments.css"]')?.outerHTML || ''}
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
            alert(`Error converting to HTML: ${error.message}`);
        });
    }
    
    // Function to convert to PDF and download
    function convertToPDF() {
        const markdown = markdownInput.value;
        
        // Create a form to submit directly for PDF download
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/convert';
        form.style.display = 'none';
        
        // Add CSRF token
        const csrfInput = document.createElement('input');
        csrfInput.type = 'hidden';
        csrfInput.name = 'csrf_token';
        csrfInput.value = document.querySelector('input[name="csrf_token"]').value;
        form.appendChild(csrfInput);
        
        // Add markdown text
        const mdTextInput = document.createElement('input');
        mdTextInput.type = 'hidden';
        mdTextInput.name = 'markdown_text';
        mdTextInput.value = markdown;
        form.appendChild(mdTextInput);
        
        // Add output format
        const formatInput = document.createElement('input');
        formatInput.type = 'hidden';
        formatInput.name = 'output_format';
        formatInput.value = 'pdf';
        form.appendChild(formatInput);
        
        // Submit the form
        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
    }
    
    // Add input event listener for real-time preview (debounced)
    let debounceTimer;
    markdownInput.addEventListener('input', function() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            showLoading(previewContent);
            updatePreview();
        }, 500);
    });
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl+Enter or Cmd+Enter to preview
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            updatePreview();
        }
        
        // Ctrl+S or Cmd+S to convert to selected format
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            const outputFormat = document.querySelector('input[name="output_format"]:checked').value;
            
            if (outputFormat === 'html') {
                convertToHTML();
            } else if (outputFormat === 'pdf') {
                convertToPDF();
            }
        }
    });
    
    // Add CSS for loading indicator and copy buttons
    const style = document.createElement('style');
    style.textContent = `
        .loading {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            color: var(--gray-500);
            font-size: 1.1rem;
        }
        
        .loading i {
            margin-right: 0.5rem;
        }
        
        .error {
            color: #e74c3c;
            padding: 1rem;
            background-color: #fdf2f2;
            border-radius: 8px;
            border-left: 4px solid #e74c3c;
        }
        
        .error i {
            margin-right: 0.5rem;
        }
        
        .copy-btn:hover {
            background: rgba(255, 255, 255, 0.2);
        }
    `;
    document.head.appendChild(style);
}); 
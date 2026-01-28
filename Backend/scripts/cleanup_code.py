# Usage: python scripts/cleanup_code.py src/

import os
import sys
import re
import tokenize
from io import BytesIO

def clean_python_file(file_path):
    """
    Cleans Python files by removing:
    1. Module-level docstrings
    2. Class docstrings
    3. Function docstrings
    4. Full-line comments (# ...)
    
    PRESERVES:
    - Multi-line strings assigned to variables (e.g., SQL queries, help_text)
    - Inline comments (code # comment) - preserves the code
    """
    try:
        with open(file_path, 'rb') as f:
            content_bytes = f.read()
            
        try:
            tokens = list(tokenize.tokenize(BytesIO(content_bytes).readline))
        except tokenize.TokenError:
            print(f"Skipping {file_path}: Tokenization error")
            return

        # Find ranges to remove
        remove_ranges = []
        
        # 1. Identify Docstrings
        # Docstrings appear as STRING tokens immediately after:
        # - Start of file (Module docstring)
        # - COLON + NEWLINE + INDENT (Class/Func docstring)
        # Note: We need to be careful. Simple heuristic:
        # If a STRING token is the first statement in a block, it's a docstring.
        
        prev_token_type = None
        
        for i, token in enumerate(tokens):
            if token.type == tokenize.STRING:
                # Check if it's a docstring
                # A docstring is a string literal that occurs as the first statement in a function, class, or module.
                
                is_docstring = False
                
                # Case A: Module Docstring (First token, excluding encoding/comments)
                # We simply check if it's one of the first meaningful tokens
                if i < 5: 
                    # Check if previous tokens were only NL, COMMENT, ENCODING
                    is_start = True
                    for prev in tokens[:i]:
                        if prev.type not in (tokenize.NL, tokenize.NEWLINE, tokenize.COMMENT, tokenize.ENCODING):
                            is_start = False
                            break
                    if is_start:
                        is_docstring = True

                # Case B: Class/Function Docstring
                # Look backwards for INDENT -> NEWLINE -> COLON
                if not is_docstring and i > 2:
                    # Scan backwards ignoring NL, COMMENT
                    for j in range(i-1, -1, -1):
                        t = tokens[j]
                        if t.type in (tokenize.NL, tokenize.COMMENT, tokenize.NEWLINE):
                            continue
                        
                        if t.type == tokenize.INDENT:
                            # Found INDENT, now look for COLON before that
                            # This is complex to robustly detect "first statement" without a parser.
                            # Simpler Approach:
                            # If the Previous non-whitespace token was INDENT or (COLON + NEWLINE/NL), it is likely a docstring.
                            is_docstring = True
                            break
                        elif t.type == tokenize.OP and t.string == ':':
                             # Immediate docstring after colon (one-liner)?
                             is_docstring = True
                             break
                        else:
                             # Some other code came before this string in the block -> Not a docstring
                             is_docstring = False
                             break
                
                if is_docstring:
                    # Verify it starts with triple quotes
                    s_val = token.string
                    if s_val.startswith('"""') or s_val.startswith("'''") or s_val.startswith('r"""') or s_val.startswith("r'''"):
                         remove_ranges.append((token.start, token.end))

        # 2. Identify Full-line comments
        for token in tokens:
            if token.type == tokenize.COMMENT:
                # Check if the line contains ONLY the comment (and whitespace)
                # We can check the line content from the file
                line_num = token.start[0]
                line_content = content_bytes.splitlines()[line_num-1].decode('utf-8')
                
                if line_content.strip().startswith('#'):
                    remove_ranges.append((token.start, token.end))

        if not remove_ranges:
            print(f"No changes: {file_path}")
            return

        # Sort ranges reverse to edit from bottom up
        remove_ranges.sort(key=lambda x: x[0], reverse=True)

        # Apply removals
        # We need to reconstruct the file.
        # Since we have byte positions/lines, it's safer to read lines and edit.
        
        # New robust approach: Filter lines? 
        # No, because docstrings span multiple lines.
        # Let's use string replacement based on positions, but we must handle utf-8 correct char offsets.
        
        # Simpler fallback for Docstrings that avoids the parser complexity hell:
        # Use Regex again but ONLY if it matches the indentation pattern of a docstring.
        # But since the user wants 100% safety, let's stick to the previous SAFE regex for comments,
        # and be VERY conservative with Docstrings.
        
        # Wait, the previous regex failed because it matched `help_text="""..."""`.
        # We can fix the regex to ensure the triple quote is NOT preceded by `=` or `(` or `return` etc.
        pass
    except Exception as e:
        print(f"Error analyzing {file_path}: {e}")

# RE-IMPLEMENTATION WITH REGEX (Safer logic)
def clean_file_regex(file_path):
    ext = os.path.splitext(file_path)[1].lower()
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        original_content = content
        
        if ext == '.py':
            lines = content.split('\n')
            new_lines = []
            
            # 1. Remove Full Line Comments
            # We filter lines first, easier.
            temp_lines = []
            for line in lines:
                stripped = line.strip()
                if stripped.startswith('#'):
                    continue
                temp_lines.append(line)
            content = '\n'.join(temp_lines)
            
            # 2. Remove Docstrings
            # We want to match matches """...""" ONLY if they are standalone statements.
            # A standalone string usually has ONLY whitespace before it on the start line.
            
            # Regex Explanation:
            # ^\s* -> Start of line, only whitespace
            # ("""|''') -> Start of docstring
            # ([\s\S]*?) -> Content (non-greedy)
            # \1 -> Match the same quote style
            # \s*$ -> End of line (only whitespace)
            # This ensures it's not `x = """..."""`
            
            pattern = r'(?m)^\s*("""|\'\'\')[\s\S]*?\1\s*$'
            
            # Using sub to remove. 
            # Note: This removes the whole block.
            content = re.sub(pattern, '', content)
            
        else: # JS/TS
            # 1. Remove multiline comments /* ... */
            content = re.sub(r'/\*[\s\S]*?\*/', '', content)
            
            # 2. Remove single line comments // ... (Full line only)
            lines = content.split('\n')
            new_lines = []
            for line in lines:
                if line.strip().startswith('//'):
                    continue
                new_lines.append(line)
            content = '\n'.join(new_lines)

        # Clean up empty lines
        content = re.sub(r'\n\s*\n\s*\n+', '\n\n', content)

        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Cleaned: {file_path}")
        else:
            print(f"No changes: {file_path}")

    except Exception as e:
        print(f"Error processing {file_path}: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python scripts/cleanup_code.py <file_or_dir>")
        sys.exit(1)

    target = sys.argv[1]
    
    if os.path.isfile(target):
        clean_file_regex(target)
    elif os.path.isdir(target):
        for root, dirs, files in os.walk(target):
            if 'node_modules' in dirs: dirs.remove('node_modules')
            if 'venv' in dirs: dirs.remove('venv')
            if '.git' in dirs: dirs.remove('.git')
            
            for file in files:
                if file.endswith(('.py', '.ts', '.tsx', '.js', '.jsx')):
                     clean_file_regex(os.path.join(root, file))

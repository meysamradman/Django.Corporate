# Usage: python python scripts/cleanup_frontend.py ../admin-panel/src

import os
import sys
import re

def clean_frontend_file(file_path):
    ext = os.path.splitext(file_path)[1].lower()
    if ext not in ['.ts', '.tsx', '.js', '.jsx']:
        return

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        original_content = content
        lines = content.split('\n')
        new_lines = []
        
        for line in lines:
            stripped = line.strip()
            
            # 1. Handle Single Line Comments (//)
            # Only remove if the line STARTS with //
            if stripped.startswith('//'):
                continue

            # 2. Handle Block Comments (/* ... */)
            # Scenario A: Single line block comment: /* comment */
            # Only remove if it takes up the whole line
            if stripped.startswith('/*') and stripped.endswith('*/'):
                if stripped.count('*/') == 1:
                    continue

            # 3. Handle JSX Comments ({/* ... */})
            # This is specific to React files (.tsx, .jsx) but safe to check in others too.
            # Strategy: Only remove if the ENTIRE line is a JSX comment.
            # Example: {/* This is a comment */} -> Remove
            # Example: <div>{/* comment */}</div> -> Keep (Too risky to touch inline)
            
            # Check if line starts with {/* and ends with */}
            if stripped.startswith('{/*') and stripped.endswith('*/}'):
                # Ensure no other code exists on this line (double check)
                # We also check that it's a single comment block, not multiple
                if stripped.count('*/}') == 1:
                     continue

            new_lines.append(line)

        # Reassemble
        content = '\n'.join(new_lines)

        # Clean up excess empty lines (preserve max 2)
        content = re.sub(r'\n\s*\n\s*\n+', '\n\n', content)

        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Cleaned: {file_path}")
        else:
            # print(f"No changes: {file_path}") 
            pass

    except Exception as e:
        print(f"Error processing {file_path}: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python scripts/cleanup_frontend.py <directory_or_file>")
        sys.exit(1)

    target = sys.argv[1]
    abs_target = os.path.abspath(target)
    print(f"Target: {abs_target}")
    
    # Allow single file processing too
    if os.path.isfile(target):
         clean_frontend_file(target)
    elif os.path.isdir(target):
        print(f"Scanning directory: {target}")
        for root, dirs, files in os.walk(target):
            # Skip node_modules and .git
            if 'node_modules' in dirs: dirs.remove('node_modules')
            if '.git' in dirs: dirs.remove('.git')
            if '.next' in dirs: dirs.remove('.next')
            if 'dist' in dirs: dirs.remove('dist')
            if 'build' in dirs: dirs.remove('build')
            
            for file in files:
                if file.endswith(('.ts', '.tsx', '.js', '.jsx')):
                     clean_frontend_file(os.path.join(root, file))
        print("Cleanup complete.")
    else:
        print(f"Target not found: {target}")

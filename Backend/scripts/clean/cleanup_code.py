import ast
import argparse
import io
import os
import re
import sys
import tokenize
from typing import Iterable, Set


PY_EXTENSIONS = {'.py'}


def _collect_docstring_lines(tree: ast.AST) -> Set[int]:
    lines_to_remove: Set[int] = set()

    def mark_docstring_from_body(body: Iterable[ast.stmt]) -> None:
        body = list(body)
        if not body:
            return
        first_stmt = body[0]
        if not isinstance(first_stmt, ast.Expr):
            return

        value = first_stmt.value
        if not isinstance(value, ast.Constant) or not isinstance(value.value, str):
            return

        start = getattr(first_stmt, 'lineno', None)
        end = getattr(first_stmt, 'end_lineno', None) or start
        if not start:
            return

        for line_no in range(start, end + 1):
            lines_to_remove.add(line_no)

    mark_docstring_from_body(getattr(tree, 'body', []))

    for node in ast.walk(tree):
        if isinstance(node, (ast.ClassDef, ast.FunctionDef, ast.AsyncFunctionDef)):
            mark_docstring_from_body(node.body)

    return lines_to_remove


def _collect_full_line_comment_lines(content: str) -> Set[int]:
    comment_lines: Set[int] = set()

    try:
        token_stream = tokenize.generate_tokens(io.StringIO(content).readline)
        for tok in token_stream:
            if tok.type != tokenize.COMMENT:
                continue

            line_no = tok.start[0]
            line_text = content.splitlines()[line_no - 1] if line_no - 1 < len(content.splitlines()) else ''
            stripped = line_text.strip()

            if not stripped.startswith('#'):
                continue

            if stripped.startswith('#!'):
                continue

            if line_no <= 2 and 'coding' in stripped:
                continue

            comment_lines.add(line_no)
    except tokenize.TokenError:
        pass

    return comment_lines


def clean_python_file(
    file_path: str,
    *,
    remove_docstrings: bool,
    remove_comments: bool,
    dry_run: bool,
    preserve_marker: str,
) -> None:
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            original_content = file.read()

        if preserve_marker and preserve_marker in original_content:
            print(f"Skipped (preserve marker): {file_path}")
            return

        if not remove_docstrings and not remove_comments:
            return

        tree = ast.parse(original_content)

        docstring_lines = _collect_docstring_lines(tree) if remove_docstrings else set()
        comment_lines = _collect_full_line_comment_lines(original_content) if remove_comments else set()

        lines_to_remove = docstring_lines.union(comment_lines)
        if not lines_to_remove:
            return

        lines = original_content.splitlines()
        cleaned_lines = [line for idx, line in enumerate(lines, start=1) if idx not in lines_to_remove]

        cleaned_content = '\n'.join(cleaned_lines)
        cleaned_content = re.sub(r'\n\s*\n\s*\n+', '\n\n', cleaned_content)

        if original_content.endswith('\n') and not cleaned_content.endswith('\n'):
            cleaned_content += '\n'

        if cleaned_content != original_content:
            if dry_run:
                print(f"Would clean: {file_path}")
                return
            with open(file_path, 'w', encoding='utf-8') as file:
                file.write(cleaned_content)
            print(f"Cleaned: {file_path}")

    except SyntaxError:
        print(f"Skipping (syntax error): {file_path}")
    except Exception as exc:
        print(f"Error processing {file_path}: {exc}")


def process_target(
    target: str,
    *,
    remove_docstrings: bool,
    remove_comments: bool,
    dry_run: bool,
    preserve_marker: str,
) -> None:
    if os.path.isfile(target):
        ext = os.path.splitext(target)[1].lower()
        if ext in PY_EXTENSIONS:
            clean_python_file(
                target,
                remove_docstrings=remove_docstrings,
                remove_comments=remove_comments,
                dry_run=dry_run,
                preserve_marker=preserve_marker,
            )
        return

    if os.path.isdir(target):
        for root, dirs, files in os.walk(target):
            if 'node_modules' in dirs:
                dirs.remove('node_modules')
            if 'venv' in dirs:
                dirs.remove('venv')
            if '.venv' in dirs:
                dirs.remove('.venv')
            if '.git' in dirs:
                dirs.remove('.git')
            if '__pycache__' in dirs:
                dirs.remove('__pycache__')

            for file_name in files:
                ext = os.path.splitext(file_name)[1].lower()
                if ext in PY_EXTENSIONS:
                    clean_python_file(
                        os.path.join(root, file_name),
                        remove_docstrings=remove_docstrings,
                        remove_comments=remove_comments,
                        dry_run=dry_run,
                        preserve_marker=preserve_marker,
                    )
        return

    print(f"Target not found: {target}")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Safe Python cleanup utility')
    parser.add_argument('target', help='Target directory or file')
    parser.add_argument(
        '--keep-docstrings',
        action='store_true',
        help='Keep Python docstrings (docstrings are removed by default)',
    )
    parser.add_argument(
        '--remove-comments',
        action='store_true',
        default=True,
        help='Remove full-line comments (enabled by default)',
    )
    parser.add_argument(
        '--keep-comments',
        action='store_true',
        help='Keep full-line comments and disable comment cleanup',
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Show files that would be cleaned without writing changes',
    )
    parser.add_argument(
        '--preserve-marker',
        default='',
        help='Skip cleaning files containing this marker text',
    )

    args = parser.parse_args()

    remove_comments = args.remove_comments and not args.keep_comments
    remove_docstrings = not args.keep_docstrings

    process_target(
        args.target,
        remove_docstrings=remove_docstrings,
        remove_comments=remove_comments,
        dry_run=args.dry_run,
        preserve_marker=args.preserve_marker,
    )

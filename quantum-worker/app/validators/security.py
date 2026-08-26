"""
Q-Learn Nexus - Python AST & Token Security Scanner
Layer 1 Defense: Validates code strings before process submission.
"""

import ast
import re
from typing import Tuple, Optional, List

FORBIDDEN_IMPORTS = {
    "os", "sys", "subprocess", "socket", "http", "urllib", "requests",
    "shutil", "pathlib", "ctypes", "multiprocessing", "threading",
    "posix", "pty", "commands", "importlib", "builtins", "__builtin__",
    "gc", "signal", "inspect", "tempfile", "glob", "pickle", "shelve",
    "dbm", "sqlite3", "psycopg2", "redis", "asyncio"
}

FORBIDDEN_FUNCTIONS = {
    "eval", "exec", "compile", "__import__", "open", "input", "globals", "locals", "vars", "breakpoint"
}

FORBIDDEN_ATTRIBUTES = {
    "__subclasses__", "__bases__", "__class__", "__globals__", "__code__", "__mro__", "__dict__"
}

class SecurityVisitor(ast.NodeVisitor):
    def __init__(self):
        self.errors: List[str] = []

    def visit_Import(self, node: ast.Import):
        for alias in node.names:
            base_mod = alias.name.split('.')[0]
            if base_mod in FORBIDDEN_IMPORTS:
                self.errors.append(f"Prohibited import: '{alias.name}'")
        self.generic_visit(node)

    def visit_ImportFrom(self, node: ast.ImportFrom):
        if node.module:
            base_mod = node.module.split('.')[0]
            if base_mod in FORBIDDEN_IMPORTS:
                self.errors.append(f"Prohibited from-import: '{node.module}'")
        self.generic_visit(node)

    def visit_Call(self, node: ast.Call):
        if isinstance(node.func, ast.Name):
            if node.func.id in FORBIDDEN_FUNCTIONS:
                self.errors.append(f"Prohibited function call: '{node.func.id}()'")
        self.generic_visit(node)

    def visit_Attribute(self, node: ast.Attribute):
        if node.attr in FORBIDDEN_ATTRIBUTES:
            self.errors.append(f"Prohibited attribute access: '{node.attr}'")
        self.generic_visit(node)


def validate_python_code(code: str) -> Tuple[bool, Optional[str]]:
    """
    Parses and scans Python code AST for prohibited system calls, network access, or escapes.
    """
    if len(code) > 100000:
        return False, "Payload size exceeds 100KB limit"

    # Static pattern check
    for forbidden in ["__subclasses__", "os.system", "subprocess", "socket.socket"]:
        if forbidden in code:
            return False, f"Static pattern violation: '{forbidden}'"

    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        return False, f"Syntax Error: {str(e)}"

    visitor = SecurityVisitor()
    visitor.visit(tree)

    if visitor.errors:
        return False, "; ".join(visitor.errors)

    return True, None

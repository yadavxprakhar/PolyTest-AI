import os
import sys
import argparse
from typing import List

# Ensure virtual env or local packages are imported cleanly
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.text import Text
from rich.status import Status
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TaskProgressColumn
from rich.syntax import Syntax

from core.config.config_manager import ConfigManager, PolytestConfig
from core.analyzer.detector import LanguageDetector
from core.analyzer.parser_factory import ParserFactory
from core.generator.test_generator import TestGenerator

console = Console()

def print_banner():
    """Print an exceptionally premium PolyTest AI banner."""
    banner_text = """
    ██████╗  ██████╗ ██╗  ██╗   ████████╗███████╗███████╗████████╗     █████╗ ██╗
    ██╔══██╗██╔═══██╗██║  ██║   ╚══██╔══╝██╔════╝██╔════╝╚══██╔══╝    ██╔══██╗██║
    ██████╔╝██║   ██║██║  ██║█████╗██║   █████╗  ███████╗   ██║       ███████║██║
    ██╔═══╝ ██║   ██║██║  ██║╚════╝██║   ██╔══╝  ╚════██║   ██║       ██╔══██║██║
    ██║     ╚██████╔╝███████║       ██║   ███████╗███████║   ██║       ██║  ██║██║
    ╚═╝      ╚═════╝ ╚══════╝       ╚═╝   ╚══════╝╚══════╝   ╚═╝       ╚═╝  ╚═╝╚═╝
    """
    console.print(Panel(Text(banner_text, style="bold cyan"), title="[bold white]v1.0.0[/bold white]", subtitle="[bold yellow]Universal Multi-Language AI Test Generator[/bold yellow]", border_style="cyan"))

def get_config_manager() -> ConfigManager:
    return ConfigManager(os.getcwd())

def cmd_init(args):
    """Initialize a default config file in the current directory."""
    print_banner()
    cm = get_config_manager()
    
    config_path = cm.initialize_default_config()
    if "already exists" in str(config_path):
        console.print(f"[bold yellow]⚠ Configuration file 'polytest.yaml' already exists in the current directory.[/bold yellow]")
    else:
        console.print(f"[bold green]✔ Successfully created default configuration file at: {config_path}[/bold green]")
        console.print("\nFeel free to open [italic]polytest.yaml[/italic] to customize your LLM provider, models, output directory, and target settings.")

def cmd_detect(args):
    """Scan and detect supported source files in the current folder."""
    print_banner()
    cm = get_config_manager()
    config = cm.load_config()
    
    target_dir = args.dir or os.getcwd()
    console.print(f"[cyan]🔍 Scanning directory: {target_dir}[/cyan]")
    
    detector = LanguageDetector()
    discovered_files = []
    
    # Exclude directories from config
    exclude_dirs = set(config.exclude_dirs)
    
    with console.status("[bold green]Walking files...[/bold green]") as status:
        for root, dirs, files in os.walk(target_dir):
            # Prune directories in-place to avoid traversing excluded folders
            dirs[:] = [d for d in dirs if d not in exclude_dirs and not d.startswith('.')]
            
            for file in files:
                full_path = os.path.join(root, file)
                lang_info = detector.detect(full_path)
                if lang_info.language != "Unknown":
                    rel_path = os.path.relpath(full_path, target_dir)
                    discovered_files.append((rel_path, lang_info))

    if not discovered_files:
        console.print("[bold red]⚠ No supported source files detected in the target folder.[/bold red]")
        return

    # Build a premium table displaying findings
    table = Table(title="[bold white]Discovered Source Files[/bold white]", border_style="cyan")
    table.add_column("Relative Path", style="green")
    table.add_column("Detected Language", style="bold yellow")
    table.add_column("Default Framework", style="magenta")
    table.add_column("Options Available", style="dim cyan")

    lang_counts = {}
    for rel_path, info in discovered_files:
        options = ", ".join(info.framework_options)
        table.add_row(rel_path, info.language, info.framework, options)
        lang_counts[info.language] = lang_counts.get(info.language, 0) + 1

    console.print(table)
    
    summary_text = "\n[bold white]Summary by Language:[/bold white] "
    summary_text += " | ".join(f"[bold cyan]{lang}[/bold cyan]: {count} file(s)" for lang, count in lang_counts.items())
    console.print(summary_text)

def cmd_analyze(args):
    """Analyze the structure of a single file and display metadata."""
    print_banner()
    file_path = args.file
    
    if not os.path.isfile(file_path):
        console.print(f"[bold red]Error: File '{file_path}' does not exist.[/bold red]")
        return
        
    detector = LanguageDetector()
    lang_info = detector.detect(file_path)
    
    if lang_info.language == "Unknown":
        console.print(f"[bold yellow]Warning: Could not auto-detect language for {file_path}. Using generic parser.[/bold yellow]")
        
    parser = ParserFactory.get_parser(lang_info.language)
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    with console.status("[bold green]Parsing file structure...[/bold green]"):
        result = parser.parse(content, file_path)

    # Output detailed structural breakdown
    console.print(Panel(
        f"[bold white]File Structure Summary[/bold white]\n"
        f"• [bold cyan]Language:[/bold cyan] {result.language}\n"
        f"• [bold cyan]Lines of Code:[/bold cyan] {result.lines_of_code}\n"
        f"• [bold cyan]Complexity Score:[/bold cyan] [bold green]{result.estimated_complexity.upper()}[/bold green]\n"
        f"• [bold cyan]Imports Count:[/bold cyan] {len(result.imports)}\n"
        f"• [bold cyan]Classes Found:[/bold cyan] {len(result.classes)}\n"
        f"• [bold cyan]Top-Level Functions:[/bold cyan] {len(result.functions)}",
        title="[bold yellow]Static Analysis Report[/bold yellow]",
        border_style="yellow"
    ))

    # Show Classes and methods table
    if result.classes:
        class_table = Table(title="[bold white]Classes & Methods Detected[/bold white]", border_style="magenta")
        class_table.add_column("Class Name", style="bold yellow")
        class_table.add_column("Base Classes", style="cyan")
        class_table.add_column("Methods", style="green")
        class_table.add_column("Complexity", style="dim white")
        
        for c in result.classes:
            method_names = [f"{m.name}()" for m in c.methods]
            method_str = ", ".join(method_names) if method_names else "[italic dim]None[/italic dim]"
            base_str = ", ".join(c.base_classes) if c.base_classes else "None"
            class_table.add_row(c.name, base_str, method_str, result.estimated_complexity)
        console.print(class_table)

    # Show functions
    if result.functions:
        func_table = Table(title="[bold white]Top-Level Functions Detected[/bold white]", border_style="cyan")
        func_table.add_column("Function Name", style="bold yellow")
        func_table.add_column("Parameters", style="green")
        func_table.add_column("Return Type", style="cyan")
        
        for f in result.functions:
            param_names = [f"{p.name}: {p.type_annotation or 'Any'}" for p in f.parameters]
            param_str = ", ".join(param_names) if param_names else "None"
            return_type = f.return_type or "Any"
            func_table.add_row(f.name, param_str, return_type)
        console.print(func_table)

def cmd_generate(args):
    """Generate unit test files."""
    print_banner()
    
    target_path = args.path
    cm = get_config_manager()
    config = cm.load_config()
    
    # Overwrite configuration using CLI parameters if specified
    provider = args.provider or config.provider
    model = args.model or config.model
    framework = args.framework
    output_dir = args.output or config.output_dir
    
    if args.mock:
        provider = "mock"
        
    console.print(Panel(
        f"• [bold cyan]LLM Provider:[/bold cyan] {provider.upper()}\n"
        f"• [bold cyan]LLM Model:[/bold cyan] {model}\n"
        f"• [bold cyan]Target Test Framework:[/bold cyan] {framework or 'Auto-Detect'}\n"
        f"• [bold cyan]Output Folder:[/bold cyan] {output_dir}\n"
        f"• [bold cyan]Local Cache Logs:[/bold cyan] Enabled",
        title="[bold yellow]Test Generation Parameters[/bold yellow]",
        border_style="yellow"
    ))

    # Initialize generator
    generator = TestGenerator(
        provider=provider,
        model=model,
        endpoint=config.endpoint,
        cache_dir=config.cache_dir
    )

    # Determine files to process
    files_to_process = []
    if os.path.isfile(target_path):
        files_to_process.append(target_path)
    elif os.path.isdir(target_path):
        detector = LanguageDetector()
        exclude_dirs = set(config.exclude_dirs)
        
        for root, dirs, files in os.walk(target_path):
            dirs[:] = [d for d in dirs if d not in exclude_dirs and not d.startswith('.')]
            for file in files:
                full_p = os.path.join(root, file)
                lang_info = detector.detect(full_p)
                if lang_info.language != "Unknown":
                    files_to_process.append(full_p)
    else:
        console.print(f"[bold red]Error: Path '{target_path}' is not a valid file or folder.[/bold red]")
        return

    if not files_to_process:
        console.print("[bold red]Error: No supported source code files discovered to process.[/bold red]")
        return

    console.print(f"\n[cyan]🚀 Ready to generate test suites for {len(files_to_process)} file(s)...[/cyan]")

    # Run processing with progress bar
    results = []
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        BarColumn(),
        TaskProgressColumn(),
        console=console
    ) as progress:
        task = progress.add_task("[green]Generating Tests[/green]", total=len(files_to_process))
        
        for file in files_to_process:
            file_name = os.path.basename(file)
            progress.update(task, description=f"[cyan]Analyzing & Generating: {file_name}[/cyan]")
            
            res = generator.generate_test(
                source_file_path=file,
                output_dir=output_dir,
                forced_framework=framework,
                use_cache=not args.no_cache
            )
            res["source_file"] = file
            results.append(res)
            progress.advance(task)

    # Print Generation Outcomes
    console.print("\n[bold white]Execution Summary[/bold white]")
    summary_table = Table(border_style="cyan")
    summary_table.add_column("Source File", style="green")
    summary_table.add_column("Output Test File", style="bold yellow")
    summary_table.add_column("Framework", style="magenta")
    summary_table.add_column("Outcome", style="bold cyan")
    summary_table.add_column("Cache", style="dim white")

    success_count = 0
    for r in results:
        if r.get("status") == "success":
            success_count += 1
            src_rel = os.path.basename(r["source_file"])
            dest_rel = os.path.basename(r["test_file"])
            cache_status = "HIT" if r.get("cached") else "MISS"
            summary_table.add_row(src_rel, dest_rel, r["framework"], "[bold green]Success[/bold green]", cache_status)
        else:
            summary_table.add_row(
                os.path.basename(r.get("source_file", "Unknown")), 
                "N/A", 
                "N/A", 
                f"[bold red]Failed: {r.get('error')}[/bold red]", 
                "N/A"
            )

    console.print(summary_table)
    console.print(f"\n[bold green]✔ Done! Successfully generated {success_count}/{len(files_to_process)} test suite(s).[/bold green]")

def main():
    parser = argparse.ArgumentParser(
        description="PolyTest AI: A multi-language static code analysis and test case generator powered by AI."
    )
    subparsers = parser.add_subparsers(dest="command", required=True, help="Subcommands")

    # Command: init
    init_parser = subparsers.add_parser("init", help="Initialize a local polytest.yaml config file.")
    init_parser.set_defaults(func=cmd_init)

    # Command: detect
    detect_parser = subparsers.add_parser("detect", help="Scan the project folder and identify supported source files.")
    detect_parser.add_argument("--dir", type=str, help="Target directory to scan (defaults to current working directory).")
    detect_parser.set_defaults(func=cmd_detect)

    # Command: analyze
    analyze_parser = subparsers.add_parser("analyze", help="Parse class structure and structural variables of a source file.")
    analyze_parser.add_argument("file", type=str, help="Source code file path to analyze.")
    analyze_parser.set_defaults(func=cmd_analyze)

    # Command: generate
    generate_parser = subparsers.add_parser("generate", help="Analyze code and build functional test suites.")
    generate_parser.add_argument("path", type=str, help="Target source file or directory.")
    generate_parser.add_argument("--framework", type=str, help="Explicitly specify the test framework (e.g. pytest, jest, junit5).")
    generate_parser.add_argument("--provider", type=str, help="Override LLM provider (mock, openai, gemini, anthropic, ollama).")
    generate_parser.add_argument("--model", type=str, help="Override LLM model (e.g. gpt-4o, gemini-1.5-flash).")
    generate_parser.add_argument("--output", type=str, help="Specify output test folder path.")
    generate_parser.add_argument("--mock", action="store_true", help="Execute completely offline using the Mock test builder.")
    generate_parser.add_argument("--no-cache", action="store_true", help="Bypass cached files and force query the LLM API.")
    generate_parser.set_defaults(func=cmd_generate)

    # Parse arguments
    args = parser.parse_args()
    args.func(args)

if __name__ == "__main__":
    main()

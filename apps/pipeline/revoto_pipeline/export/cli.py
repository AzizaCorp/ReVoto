"""Punto de acceso único a modalidades de publicación; los controles no se relajan."""
from __future__ import annotations

import argparse
from pathlib import Path
import subprocess
import sys


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description='REVOTO: exportación L4 dual')
    parser.add_argument('--mode', choices=('strict','exploratory'), required=True)
    parser.add_argument('--dry-run', action='store_true', help='Solo válido en modo strict')
    parser.add_argument('--allow-missing', action='store_true', help='Solo exploratorio')
    parser.add_argument('--threshold',type=int,default=None,help='RN-05: solo modo exploratorio')
    parser.add_argument('--topo-quantization', type=int, default=None)
    parser.add_argument('--topo-max-error-m', type=float, default=None)
    parser.add_argument('--topo-budget-kb', type=int, default=None)
    args = parser.parse_args(argv)
    if args.mode == 'strict':
        if (args.allow_missing or args.threshold is not None or
            args.topo_quantization is not None or args.topo_max_error_m is not None or
            args.topo_budget_kb is not None):
            parser.error('strict no permite los flags de datos exploratorios')
        from revoto_pipeline.config import load_config
        from revoto_pipeline.export.frontend import export_web
        cfg = load_config()
        print(export_web(cfg, tuple(range(1,33)), dry_run=args.dry_run))
    else:
        if args.dry_run:
            parser.error('La modalidad exploratoria ya publica fuera de public/')
        command = [sys.executable, '-m', 'revoto_pipeline.export.exportar_ine_exploratorio']
        if args.allow_missing:
            command.append('--permitir-particiones-faltantes')
        if args.threshold is not None:
            if args.threshold < 1:
                parser.error('RN-05 requiere umbral positivo')
            command.extend(['--umbral', str(args.threshold)])
        for flag, val in (('--topo-quantization', args.topo_quantization),
                          ('--topo-max-error-m', args.topo_max_error_m),
                          ('--topo-budget-kb', args.topo_budget_kb)):
            if val is not None:
                command.extend([flag, str(val)])
        subprocess.run(command, cwd=Path(__file__).resolve().parents[2], check=True)


if __name__ == '__main__':
    main()

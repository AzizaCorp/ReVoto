"""Reconciliar el mapping exploratorio INE-prioritario sin tocar datos electorales."""
from __future__ import annotations

import argparse
import csv
from pathlib import Path

from revoto_pipeline.model.identidad_operativa import reconcile_operational_rows


def read_csv(path: Path) -> list[dict]:
    with path.open(encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def write_csv(path: Path, rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    columns = list(rows[0]) if rows else []
    tmp = path.with_suffix(path.suffix + ".tmp")
    with tmp.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=columns)
        writer.writeheader(); writer.writerows(rows)
    tmp.replace(path)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    rows = read_csv(args.input)
    result = reconcile_operational_rows(rows)
    write_csv(args.output, result)
    before = len({r.get("identificador_operativo", "") for r in rows})
    after = len({r.get("identificador_operativo", "") for r in result})
    counts = {}
    for row in result:
        counts[row["estado_resolucion"]] = counts.get(row["estado_resolucion"], 0) + 1
    print(f"filas={len(result):,}; identidades {before:,} -> {after:,}")
    print("resoluciones:", ", ".join(f"{k}={v:,}" for k,v in sorted(counts.items())))
    print(args.output)


if __name__ == "__main__":
    main()

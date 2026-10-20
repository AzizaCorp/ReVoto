"""Regresiones del hash L4 con root de prueba distinto del checkout."""
from dataclasses import replace
from pathlib import Path
from revoto_pipeline.config import CONFIG_FILE, load_config
from revoto_pipeline.export.frontend import _version


def test_version_accepts_code_outside_cfg_root(tmp_path):
    cfg = load_config(CONFIG_FILE, tmp_path)
    data = tmp_path / 'inputs' / 'datos.csv'
    data.parent.mkdir()
    data.write_text('a,b\n1,2\n', encoding='utf-8')
    code = Path(__file__).resolve().parents[1] / 'revoto_pipeline' / 'export' / 'frontend.py'
    assert _version(cfg, [data, code]) == _version(cfg, [code, data])


def test_version_changes_if_input_changes(tmp_path):
    cfg = load_config(CONFIG_FILE, tmp_path)
    file = tmp_path / 'data.csv'
    file.write_text('antes', encoding='utf-8')
    original = _version(cfg, [file])
    file.write_text('despues', encoding='utf-8')
    assert _version(cfg, [file]) != original

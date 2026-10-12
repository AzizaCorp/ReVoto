"""DuckDB integration checks against deliberately tiny synthetic inputs."""
import pytest
from pathlib import Path

duckdb = pytest.importorskip('duckdb')
from revoto_pipeline.transform.ine import ine_select, municipality_select
from revoto_pipeline.validation.schemas import INE_COLUMNS
from revoto_pipeline.validation.quality import ine_quality,assert_ine_quality
from revoto_pipeline.sql_utils import copy_parquet


def csv_fixture(tmp_path):
    file=tmp_path/'ine.csv'
    first=['2009','5/7/2009','1','AGS','1','Aguascalientes','522','U',
           ' ',' ','0','22','10','4','6','0']
    second=['2009','5/7/2009','1','AGS','1','Aguascalientes','522','U',
            '2','15','1','23','90','72','18','0']
    file.write_text(','.join(INE_COLUMNS)+'\n'+','.join(first)+'\n'+','.join(second)+'\n',encoding='utf-8')
    return file


def test_whitespace_nullable_missing_district(tmp_path):
    con=duckdb.connect()
    stage=tmp_path/'out.parquet'
    copy_parquet(con,ine_select(csv_fixture(tmp_path),2009),stage)
    got=con.execute(f"SELECT DEF, DEL, missing_def, missing_del FROM read_parquet('{stage}') ORDER BY SEXO").fetchall()
    assert got == [(None,None,True,True),(2,15,False,False)]
    report=ine_quality(con,stage,2009,1)
    assert report['rows']==2 and report['missing_def']==1 and report['missing_del']==1
    assert_ine_quality(report)


def test_weighted_rate_is_not_average_of_rates(tmp_path):
    con=duckdb.connect()
    stage=tmp_path/'out.parquet'
    copy_parquet(con,ine_select(csv_fixture(tmp_path),2009),stage)
    query=municipality_select(stage,False)
    data=con.execute(query).fetchone()
    # 4/10 = 40%, 72/90 = 80%, pooled = 76/100 = 76%.
    assert data[-1]==76.0


def test_non_numeric_bad_counts_fail(tmp_path):
    file=csv_fixture(tmp_path)
    contents=file.read_text().replace(',90,72,18,0',',oops,72,18,0')
    file.write_text(contents)
    con=duckdb.connect()
    stage=tmp_path/'out.parquet'
    copy_parquet(con,ine_select(file,2009),stage)
    with pytest.raises(ValueError,match='bad_counts'):
        assert_ine_quality(ine_quality(con,stage,2009,1))

def test_participacion_excluye_ns():
    from revoto_pipeline.model.reglas import participacion

    assert participacion(60, 100, 10) == pytest.approx(66.6666666667)
    assert participacion(60, 100, 100) is None
    assert participacion(60, 100, None) is None
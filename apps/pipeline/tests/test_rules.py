"""Pure-Python checks; no input datasets required."""
import pytest
from pathlib import Path
from revoto_pipeline.validation.schemas import check_header, SchemaError, INE_COLUMNS
from revoto_pipeline.transform.inegi import find_sex_pairs
from revoto_pipeline.geo.crosswalk import dms_to_decimal
from revoto_pipeline.transform.conapo import CONAPO_SEX_MAP


def test_schema_unexpected_column(tmp_path):
    f=tmp_path/'test.csv'
    f.write_text(','.join([*INE_COLUMNS,'SNEAKY'])+'\n',encoding='utf-8')
    with pytest.raises(SchemaError,match='inesperadas'):
        check_header(f,INE_COLUMNS,exact=True)


def test_sex_pairs_requires_observed_official_columns():
    got=find_sex_pairs(['POB_AFRO','POB_AFRO_F','POB_AFRO_M','PCON_DISC',
                        'POBTOT','POBFEM','POBMAS'])
    assert got['POB_AFRO']==('POB_AFRO_F','POB_AFRO_M')
    assert got['POBTOT']==('POBFEM','POBMAS')
    assert 'PCON_DISC' not in got


def test_conapo_sex_mapping():
    assert CONAPO_SEX_MAP == {'HOMBRES':0,'MUJERES':1}


def test_dms_coordinates():
    assert dms_to_decimal('95°42\'19.854" W') == pytest.approx(-95.705515)
    assert dms_to_decimal('17°20\'25.133" N') == pytest.approx(17.34031472)
    assert dms_to_decimal('*') is None

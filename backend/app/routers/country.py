import uuid
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.country import Country
from app.schemas.country import CountryCreate, CountryOut

router = APIRouter()


@router.get("/", response_model=list[CountryOut])
def list_countries(
    locale: str = Query("zh", description="zh=按中文排序返回, en=按英文排序返回"),
    db: Session = Depends(get_db),
):
    order_col = Country.country_cn if locale == "zh" else Country.country_en
    return db.query(Country).order_by(order_col).all()


@router.post("/", response_model=CountryOut, status_code=201)
def create_country(payload: CountryCreate, db: Session = Depends(get_db)):
    country = Country(
        id=uuid.uuid4(),
        country_cn=payload.country_cn,
        country_en=payload.country_en,
    )
    db.add(country)
    db.flush()
    db.refresh(country)
    return country

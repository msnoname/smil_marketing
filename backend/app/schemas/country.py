import uuid
from pydantic import BaseModel


class CountryBase(BaseModel):
    country_cn: str
    country_en: str


class CountryCreate(CountryBase):
    pass


class CountryOut(CountryBase):
    id: uuid.UUID

    class Config:
        from_attributes = True

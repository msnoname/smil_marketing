import uuid
from pydantic import BaseModel


class VehicleModelBase(BaseModel):
    country_id: uuid.UUID
    brand: str
    model: str
    model_year: int | None = None


class VehicleModelCreate(BaseModel):
    country_id: uuid.UUID
    brand: str
    model: str
    model_year: int | None = None


class VehicleModelOut(BaseModel):
    id: uuid.UUID
    country_id: uuid.UUID
    brand: str
    model: str
    model_year: int | None = None
    original_url: str | None = None

    class Config:
        from_attributes = True


class ModelMergeOut(BaseModel):
    original_url: str


class ModelFileUploadOut(BaseModel):
    id: uuid.UUID
    url: str

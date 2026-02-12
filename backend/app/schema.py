from pydantic import BaseModel
from typing import Optional, List

class TranscriptInput(BaseModel):
    text: str


class TranscriptSummary(BaseModel):
    id: int
    created_at: str
    item_count: int

# Action Items

class ActionItemBase(BaseModel):
    task: str
    owner: Optional[str] = None
    due_date: Optional[str] = None


class ActionItemCreate(ActionItemBase):
    transcript_id: int


class ActionItemUpdate(BaseModel):
    task: Optional[str] = None
    owner: Optional[str] = None
    due_date: Optional[str] = None
    status: Optional[str] = None  


class ActionItem(ActionItemBase):
    id: int
    transcript_id: int
    status: str

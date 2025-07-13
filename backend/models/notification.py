from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid

class Notification(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    message: str
    type: str = "info"
    action_url: Optional[str] = None
    read: bool = False
    read_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow) 
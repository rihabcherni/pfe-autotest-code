from typing import List
from pydantic import BaseModel

class PermissionRequestSchema(BaseModel):
    requested_permissions: List[str]
    user_id: int

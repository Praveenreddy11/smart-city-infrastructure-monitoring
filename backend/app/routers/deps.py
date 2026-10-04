from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.core.security import decode_access_token
from backend.app.models.models import User, Worker

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
        
    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception
        
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None or not user.is_active:
        raise credentials_exception
        
    return user

def get_current_authority(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "AUTHORITY":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Authority privileges required to perform this action."
        )
    return current_user

def get_current_worker(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Worker:
    if current_user.role != "WORKER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Worker privileges required to perform this action."
        )
    worker = db.query(Worker).filter(Worker.user_id == current_user.id).first()
    if not worker:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Worker profile associated with this account was not found."
        )
    return worker

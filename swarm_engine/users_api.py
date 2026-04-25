"""
Users & Reports API router for LC-EWS.
Mounted on the main FastAPI app in engine.py.
"""
import random
import string
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from models import User, Report
from auth import get_current_user, require_role

router = APIRouter(tags=["users-reports"])


# ── Helper ────────────────────────────────────────────────────
def _user_out(u: User) -> dict:
    return {
        "id":         u.id,
        "name":       u.name,
        "email":      u.email,
        "role":       u.role,
        "created_at": u.created_at.isoformat(),
    }


def _report_out(r: Report) -> dict:
    return {
        "id":             r.id,
        "report_id":      r.report_id,
        "observer_name":  r.observer_name,
        "zone":           r.zone,
        "risk_level":     r.risk_level,
        "estimated_size": r.estimated_size,
        "description":    r.description,
        "status":         r.status,
        "lat":            r.lat,
        "lon":            r.lon,
        "created_at":     r.created_at.isoformat(),
    }


# ── Users ─────────────────────────────────────────────────────
@router.get("/api/users")
async def list_users(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """All authenticated users can see the team list."""
    result = await db.execute(
        select(User).where(User.is_active.is_(True)).order_by(User.created_at.desc())
    )
    return [_user_out(u) for u in result.scalars().all()]


@router.delete("/api/users/{user_id}")
async def delete_user(
    user_id: int,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    """Soft-delete a user. Admin only. Cannot delete yourself."""
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = False
    await db.commit()
    return {"status": "deleted", "user_id": user_id}


# ── Reports ───────────────────────────────────────────────────
class ReportCreate(BaseModel):
    zone:           str
    risk_level:     str
    description:    str
    estimated_size: str = None
    lat:            float = None
    lon:            float = None


@router.get("/api/reports")
async def list_reports(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """All roles can list reports."""
    result = await db.execute(
        select(Report).order_by(Report.created_at.desc()).limit(100)
    )
    return [_report_out(r) for r in result.scalars().all()]


@router.post("/api/reports")
async def create_report(
    req: ReportCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Any logged-in user can submit a field report."""
    rpt_id = "RPT-" + "".join(random.choices(string.digits, k=4))
    report = Report(
        report_id=rpt_id,
        user_id=current_user.id,
        observer_name=current_user.name,
        zone=req.zone,
        risk_level=req.risk_level,
        estimated_size=req.estimated_size,
        description=req.description,
        lat=req.lat,
        lon=req.lon,
        status="Pending",
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)
    return _report_out(report)


@router.patch("/api/reports/{report_id}/verify")
async def verify_report(
    report_id: str,
    current_user: User = Depends(require_role("admin", "analyst")),
    db: AsyncSession = Depends(get_db),
):
    """Admin or Analyst can verify/reject a report."""
    result = await db.execute(select(Report).where(Report.report_id == report_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    report.status = "Verified"
    await db.commit()
    return {"status": "verified", "report_id": report_id}

"""
Users, Reports, Drones & Missions API router for LC-EWS.
Mounted on the main FastAPI app in engine.py.
"""
import random
import string
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from database import get_db
from models import User, Report, Drone, Mission, Alert
from auth import get_current_user, require_role

router = APIRouter(tags=["users-reports"])


# ── Helpers ───────────────────────────────────────────────────
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
        "id":                r.id,
        "report_id":         r.report_id,
        "user_id":           r.user_id,
        "observer_name":     r.observer_name,
        "zone":              r.zone,
        "risk_level":        r.risk_level,
        "estimated_size":    r.estimated_size,
        "description":       r.description,
        "status":            r.status,
        "lat":               r.lat,
        "lon":               r.lon,
        "reviewer_feedback":  r.reviewer_feedback,
        "reviewed_by":       r.reviewed_by,
        "reviewed_at":       r.reviewed_at.isoformat() if r.reviewed_at else None,
        "created_at":        r.created_at.isoformat(),
    }


def _drone_out(d: Drone) -> dict:
    return {
        "id":         d.id,
        "drone_id":   d.drone_id,
        "model":      d.model,
        "status":     d.status,
        "battery":    d.battery,
        "lat":        d.lat,
        "lon":        d.lon,
        "created_at": d.created_at.isoformat(),
    }


def _mission_out(m: Mission, drone: Drone = None, report: Report = None) -> dict:
    out = {
        "id":            m.id,
        "mission_id":    m.mission_id,
        "drone_id":      m.drone_id,
        "report_id":     m.report_id,
        "mission_type":  m.mission_type,
        "coverage_km":   m.coverage_km,
        "altitude_m":    m.altitude_m,
        "status":        m.status,
        "notes":         m.notes,
        "assigned_by":   m.assigned_by,
        "started_at":    m.started_at.isoformat() if m.started_at else None,
        "completed_at":  m.completed_at.isoformat() if m.completed_at else None,
        "created_at":    m.created_at.isoformat(),
    }
    if drone:
        out["drone"] = _drone_out(drone)
    if report:
        out["report"] = _report_out(report)
    return out


def _alert_out(a: Alert) -> dict:
    return {
        "id":          a.id,
        "type":        a.type,
        "title":       a.title,
        "description": a.description,
        "is_read":     a.is_read,
        "created_at":  a.created_at.isoformat(),
    }


# ── Alerts ────────────────────────────────────────────────────
@router.get("/api/alerts")
async def list_alerts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Fetch recent alerts for the dashboard."""
    result = await db.execute(
        select(Alert).order_by(Alert.created_at.desc()).limit(50)
    )
    return [_alert_out(a) for a in result.scalars().all()]


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


class ReportReview(BaseModel):
    status:   str      # "Verified" or "Rejected"
    feedback: str = ""


@router.patch("/api/reports/{report_id}/review")
async def review_report(
    report_id: str,
    req: ReportReview,
    current_user: User = Depends(require_role("admin", "analyst")),
    db: AsyncSession = Depends(get_db),
):
    """Admin or Analyst can approve/reject a report with feedback."""
    if req.status not in ("Verified", "Rejected"):
        raise HTTPException(status_code=400, detail="Status must be 'Verified' or 'Rejected'")

    result = await db.execute(select(Report).where(Report.report_id == report_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    report.status = req.status
    report.reviewer_feedback = req.feedback or None
    report.reviewed_by = current_user.name
    report.reviewed_at = datetime.utcnow()

    # Create an alert if verified as Critical or High
    if req.status == "Verified" and report.risk_level in ("Critical", "High"):
        alert_type = "critical" if report.risk_level == "Critical" else "warning"
        alert_title = f"Verified {report.risk_level} Swarm — {report.zone}"
        alert_desc = report.description[:100] + "..." if len(report.description) > 100 else report.description
        
        alert = Alert(
            type=alert_type,
            title=alert_title,
            description=f"{alert_desc} (Report ID: {report.report_id})",
        )
        db.add(alert)

    await db.commit()
    return _report_out(report)


@router.delete("/api/reports/{report_id}")
async def delete_report(
    report_id: str,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    """Admin can permanently delete a report. Blocked if active missions reference it."""
    result = await db.execute(select(Report).where(Report.report_id == report_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Block deletion if linked missions are still active
    active_missions = await db.execute(
        select(func.count(Mission.id)).where(
            Mission.report_id == report.id,
            Mission.status.in_(["Assigned", "In Progress"]),
        )
    )
    active_count = active_missions.scalar()
    if active_count:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete: {active_count} active mission(s) linked to this report",
        )

    # Remove completed/cancelled missions linked to this report
    from sqlalchemy import delete as sql_delete
    await db.execute(
        sql_delete(Mission).where(Mission.report_id == report.id)
    )

    await db.delete(report)
    await db.commit()
    return {"status": "deleted", "report_id": report_id}


# ══════════════════════════════════════════════════════════════
# ── Drones ────────────────────────────────────────────────────
# ══════════════════════════════════════════════════════════════

@router.get("/api/drones")
async def list_drones(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all drones in the fleet."""
    result = await db.execute(select(Drone).order_by(Drone.drone_id))
    return [_drone_out(d) for d in result.scalars().all()]


class DroneStatusUpdate(BaseModel):
    status:  Optional[str] = None
    battery: Optional[int] = None


@router.patch("/api/drones/{drone_id}/status")
async def update_drone_status(
    drone_id: str,
    req: DroneStatusUpdate,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    """Admin can update drone status/battery."""
    valid_statuses = {"Available", "On Mission", "Maintenance", "Charging"}
    if req.status and req.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Status must be one of {valid_statuses}")

    result = await db.execute(select(Drone).where(Drone.drone_id == drone_id))
    drone = result.scalar_one_or_none()
    if not drone:
        raise HTTPException(status_code=404, detail="Drone not found")

    if req.status is not None:
        drone.status = req.status
    if req.battery is not None:
        old_battery = drone.battery
        drone.battery = max(0, min(100, req.battery))
        
        # Create an alert if battery drops to 20% or below
        if old_battery > 20 and drone.battery <= 20:
            alert = Alert(
                type="info",
                title=f"Drone Low Battery — {drone.drone_id}",
                description=f"Battery at {drone.battery}%. Return to base recommended.",
            )
            db.add(alert)

    await db.commit()
    await db.refresh(drone)
    return _drone_out(drone)


class DroneCreate(BaseModel):
    drone_id: str
    model:    str
    battery:  int = 100


@router.post("/api/drones")
async def create_drone(
    req: DroneCreate,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    """Admin can add a new drone to the fleet."""
    # Check duplicate drone_id
    existing = await db.execute(select(Drone).where(Drone.drone_id == req.drone_id))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail=f"Drone ID '{req.drone_id}' already exists")

    drone = Drone(
        drone_id=req.drone_id,
        model=req.model,
        status="Available",
        battery=max(0, min(100, req.battery)),
    )
    db.add(drone)
    await db.commit()
    await db.refresh(drone)
    return _drone_out(drone)


# ══════════════════════════════════════════════════════════════
# ── Missions ──────────────────────────────────────────────────
# ══════════════════════════════════════════════════════════════

@router.get("/api/missions")
async def list_missions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all missions with expanded drone and report data."""
    result = await db.execute(
        select(Mission).order_by(Mission.created_at.desc()).limit(100)
    )
    missions = result.scalars().all()

    out = []
    for m in missions:
        # Fetch related drone and report
        drone_res = await db.execute(select(Drone).where(Drone.id == m.drone_id))
        drone = drone_res.scalar_one_or_none()
        report_res = await db.execute(select(Report).where(Report.id == m.report_id))
        report = report_res.scalar_one_or_none()
        out.append(_mission_out(m, drone=drone, report=report))

    return out


class MissionCreate(BaseModel):
    drone_id:     int           # drones.id
    report_id:    int           # reports.id
    mission_type: str           # Survey | Spray | Monitor | Patrol
    coverage_km:  float = 10.0
    altitude_m:   float = 500.0
    notes:        str = ""


@router.post("/api/missions")
async def create_mission(
    req: MissionCreate,
    current_user: User = Depends(require_role("admin", "analyst")),
    db: AsyncSession = Depends(get_db),
):
    """Assign a drone to a verified report. Admin or Analyst only."""
    valid_types = {"Survey", "Spray", "Monitor", "Patrol"}
    if req.mission_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"mission_type must be one of {valid_types}")

    # Validate drone exists and is available
    drone_res = await db.execute(select(Drone).where(Drone.id == req.drone_id))
    drone = drone_res.scalar_one_or_none()
    if not drone:
        raise HTTPException(status_code=404, detail="Drone not found")
    if drone.status != "Available":
        raise HTTPException(status_code=400, detail=f"Drone {drone.drone_id} is not available (current: {drone.status})")

    # Validate report exists and is verified
    report_res = await db.execute(select(Report).where(Report.id == req.report_id))
    report = report_res.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if report.status != "Verified":
        raise HTTPException(status_code=400, detail="Only verified reports can have missions assigned")

    # Generate unique mission ID
    msn_id = "MSN-" + "".join(random.choices(string.digits, k=4))

    mission = Mission(
        mission_id=msn_id,
        drone_id=drone.id,
        report_id=report.id,
        mission_type=req.mission_type,
        coverage_km=req.coverage_km,
        altitude_m=req.altitude_m,
        status="Assigned",
        notes=req.notes or None,
        assigned_by=current_user.id,
    )
    db.add(mission)

    # Mark drone as on mission and set its position to report coordinates
    drone.status = "On Mission"
    if report.lat and report.lon:
        drone.lat = report.lat
        drone.lon = report.lon

    await db.commit()
    await db.refresh(mission)

    return _mission_out(mission, drone=drone, report=report)


class MissionStatusUpdate(BaseModel):
    status: str   # "In Progress" | "Completed" | "Aborted"


@router.patch("/api/missions/{mission_id}/status")
async def update_mission_status(
    mission_id: str,
    req: MissionStatusUpdate,
    current_user: User = Depends(require_role("admin", "analyst")),
    db: AsyncSession = Depends(get_db),
):
    """Update mission status. Returns drone to Available when completed/aborted."""
    valid = {"In Progress", "Completed", "Aborted"}
    if req.status not in valid:
        raise HTTPException(status_code=400, detail=f"Status must be one of {valid}")

    result = await db.execute(select(Mission).where(Mission.mission_id == mission_id))
    mission = result.scalar_one_or_none()
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")

    if mission.status in ("Completed", "Aborted"):
        raise HTTPException(status_code=400, detail="Mission already finalized")

    mission.status = req.status

    if req.status == "In Progress":
        mission.started_at = datetime.utcnow()
    elif req.status in ("Completed", "Aborted"):
        mission.completed_at = datetime.utcnow()
        # Return drone to Available
        drone_res = await db.execute(select(Drone).where(Drone.id == mission.drone_id))
        drone = drone_res.scalar_one_or_none()
        if drone:
            drone.status = "Available"
            drone.lat = None
            drone.lon = None

    await db.commit()

    # Fetch expanded data for response
    drone_res = await db.execute(select(Drone).where(Drone.id == mission.drone_id))
    drone = drone_res.scalar_one_or_none()
    report_res = await db.execute(select(Report).where(Report.id == mission.report_id))
    report = report_res.scalar_one_or_none()

    return _mission_out(mission, drone=drone, report=report)

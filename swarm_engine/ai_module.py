"""
LC-EWS AI Module — Search-Based Swarm Spread Prediction

First a BFS is implemented on a zone adjacency graph to predict the possible
locust swarm migration across the most locust-prone regions in Pakistan.

Problem Formulation

- Initial State : The zone where a swarm / verified report is located.
- Goal State    : Identify ALL zones reachable from the initial zone
                  (BFS levels = time steps of predicted spread).
- Actions       : A swarm can migrate from one zone to any *adjacent* zone
                  in a single time step.
- Transitions   : zone_A --edge--> zone_B   (bidirectional adjacency).
- State Space   : An undirected graph where nodes = zones and edges =
                  geographic adjacency.
"""

from __future__ import annotations
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from collections import deque
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from models import Report

router = APIRouter()


"""STATE SPACE REPRESENTATION — Zone Graph
- Each zone is a node.  Edges are defined by geographic adjacency.
- Coordinates = centre point of each zone (for A* heuristic later).
"""

ZONES: Dict[str, Dict[str, Any]] = {
    "Khuzdar Valley":   {"lat": 27.5,  "lon": 66.5},
    "Quetta":           {"lat": 30.25, "lon": 66.75},
    "Jacobabad Plains": {"lat": 28.25, "lon": 68.5},
    "D.I. Khan":        {"lat": 31.75, "lon": 70.75},
    "Thar Desert":      {"lat": 26.0,  "lon": 70.5},
    "Cholistan Desert": {"lat": 28.75, "lon": 72.25},
    "Dera Ghazi Khan":  {"lat": 30.0,  "lon": 70.25},
    "Bahawalpur":       {"lat": 29.5,  "lon": 71.5},
    "Lasbela":          {"lat": 26.0,  "lon": 66.5},
    "Turbat":           {"lat": 26.5,  "lon": 63.5},
    "Gwadar":           {"lat": 25.5,  "lon": 62.25},
    "Nushki":           {"lat": 29.5,  "lon": 65.5},
    "Sibi":             {"lat": 29.5,  "lon": 67.75},
    "Nasirabad":        {"lat": 28.25, "lon": 67.75},
    "Sukkur":           {"lat": 27.75, "lon": 69.25},
    "Rahimyar Khan":    {"lat": 28.5,  "lon": 70.25},
}

""" Adjacency list (undirected — both directions stored)"""

ADJACENCY: Dict[str, List[str]] = {
    "Khuzdar Valley":   ["Lasbela", "Nushki", "Nasirabad", "Sibi"],
    "Quetta":           ["Nushki", "Sibi"],
    "Jacobabad Plains": ["Nasirabad", "Sibi", "Sukkur"],
    "D.I. Khan":        ["Dera Ghazi Khan"],
    "Thar Desert":      ["Sukkur", "Rahimyar Khan", "Cholistan Desert"],
    "Cholistan Desert": ["Thar Desert", "Bahawalpur", "Rahimyar Khan"],
    "Dera Ghazi Khan":  ["D.I. Khan", "Bahawalpur", "Sibi", "Rahimyar Khan"],
    "Bahawalpur":       ["Cholistan Desert", "Dera Ghazi Khan", "Rahimyar Khan"],
    "Lasbela":          ["Khuzdar Valley", "Turbat"],
    "Turbat":           ["Lasbela", "Gwadar"],
    "Gwadar":           ["Turbat"],
    "Nushki":           ["Khuzdar Valley", "Quetta"],
    "Sibi":             ["Khuzdar Valley", "Quetta", "Jacobabad Plains", "Nasirabad", "Dera Ghazi Khan"],
    "Nasirabad":        ["Khuzdar Valley", "Jacobabad Plains", "Sibi", "Sukkur"],
    "Sukkur":           ["Jacobabad Plains", "Nasirabad", "Thar Desert", "Rahimyar Khan"],
    "Rahimyar Khan":    ["Sukkur", "Thar Desert", "Cholistan Desert", "Bahawalpur", "Dera Ghazi Khan"],
}


""" BFS — Breadth-First Spread Prediction """

def bfs_spread(start_zone: str, max_depth: Optional[int] = None) -> Dict[str, Any]:
    """
    Run BFS from start_zone to predict swarm spread.
    """
    if start_zone not in ZONES:
        raise ValueError(f"Unknown zone: {start_zone}")

    visited: set[str] = {start_zone}
    queue: deque[tuple[str, int]] = deque([(start_zone, 0)])

    levels: Dict[int, List[str]] = {0: [start_zone]}
    visit_order: List[str] = [start_zone]
    edges_traversed: List[List[str]] = []

    while queue:
        current, depth = queue.popleft()

        if max_depth is not None and depth >= max_depth:
            continue

        for neighbor in ADJACENCY.get(current, []):
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append((neighbor, depth + 1))
                visit_order.append(neighbor)
                edges_traversed.append([current, neighbor])

                next_depth = depth + 1
                if next_depth not in levels:
                    levels[next_depth] = []
                levels[next_depth].append(neighbor)

    level_list = [
        {"depth": d, "zones": zones}
        for d, zones in sorted(levels.items())
    ]

    return {
        "algorithm": "BFS",
        "start_zone": start_zone,
        "start_coords": ZONES[start_zone],
        "levels": level_list,
        "visit_order": visit_order,
        "edges_traversed": edges_traversed,
        "total_zones_affected": len(visited),
        "max_depth_reached": max(levels.keys()) if levels else 0,
        "zone_coords": {z: ZONES[z] for z in visited},
    }



class BFSRequest(BaseModel):
    start_zone: str
    max_depth: Optional[int] = None   # None = explore all


@router.post("/api/ai/bfs")
async def run_bfs(req: BFSRequest):
    """
    Run BFS spread prediction from a given zone.
    Returns the exploration levels, visit order, and traversed edges.
    """
    try:
        result = bfs_spread(req.start_zone, req.max_depth)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return result


@router.get("/api/ai/bfs/from-report/{report_id}")
async def run_bfs_from_report(
    report_id: str,
    max_depth: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """
    Run BFS using a verified report's zone as the starting point.
    Fetches the report from DB, maps its zone to the graph, and runs BFS.
    """
    result = await db.execute(select(Report).where(Report.report_id == report_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    zone = report.zone
    if zone not in ZONES:
        raise HTTPException(status_code=400, detail=f"Report zone '{zone}' not in AI graph")

    bfs_result = bfs_spread(zone, max_depth)
    bfs_result["source_report"] = {
        "report_id": report.report_id,
        "zone": report.zone,
        "risk_level": report.risk_level,
        "lat": report.lat,
        "lon": report.lon,
        "observer_name": report.observer_name,
    }
    return bfs_result


@router.get("/api/ai/zones")
async def get_zones():
    """
    Return the full zone graph (nodes + adjacency) for frontend visualization.
    """
    return {
        "zones": {
            name: {**coords, "neighbors": ADJACENCY.get(name, [])}
            for name, coords in ZONES.items()
        },
        "edges": [
            {"from": z, "to": n}
            for z, neighbors in ADJACENCY.items()
            for n in neighbors
            if z < n  # avoid duplicates for undirected graph
        ],
        "total_zones": len(ZONES),
        "total_edges": sum(len(v) for v in ADJACENCY.values()) // 2,
    }

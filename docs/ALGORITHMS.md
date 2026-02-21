# Project Algorithms

This document provides a high-level overview of the key algorithms used in the EvacAI application.

## 1. Dijkstra's Algorithm for Route Optimization

- **Purpose**: To find the optimal (least crowded) path between a start and end zone.
- **Location**: `src/lib/actions.ts` within the `getRouteAction` function.
- **How it Works**:
    1.  **Graph Representation**: The event space is modeled as a graph where each `Zone` is a node. Edges exist between zones if they are physically adjacent (determined by bounding box overlaps).
    2.  **Dynamic Cost Function**: Each edge traversal is assigned a cost based on the destination zone's current density:
        - `free`: 1
        - `moderate`: 3
        - `crowded`: 10
        - `over-crowded`: 100
    3.  **Pathfinding**: The algorithm explores the graph to find the path with the lowest cumulative cost. By assigning exponentially higher costs to crowded zones, the algorithm naturally prioritizes longer "free" paths over shorter "congested" ones.
    4.  **Alternative Routes**: We run the algorithm twice—once with density costs and once with uniform costs (1). If the results differ, we present the "congested" route as an avoided path.

## 2. Ray-Casting Algorithm for Geolocation

- **Purpose**: To determine which `Zone` a user is currently inside based on real-time GPS coordinates.
- **Location**: `src/components/user/user-dashboard.tsx` in the `isPointInPolygon` function.
- **How it Works**:
    1.  **Point and Polygon**: The user's location is a point (`lat`, `lng`), and each `Zone` is a polygon defined by corner coordinates.
    2.  **Intersection Test**: The algorithm projects an infinite ray horizontally from the user's point. It then counts how many times this ray intersects the edges of the zone's polygon.
    3.  **Inside/Outside Determination**: 
        - If the number of intersections is **odd**, the user is **inside**.
        - If the number of intersections is **even**, the user is **outside**.
    4.  **Performance**: By moving this to the client-side, we avoid sending a network request for every single GPS ping, allowing for near-instant zone identification without server lag.

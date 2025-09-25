# Project Algorithms

This document provides a high-level overview of the key algorithms used in the CrowdNav application.

## 1. Dijkstra's Algorithm for Route Optimization

- **Purpose**: To find the optimal (least crowded) path between a start and end zone.
- **Location**: `src/lib/actions.ts` in the `findPath` function.
- **How it Works**:
    1.  **Graph Representation**: The event space is modeled as a graph where each `Zone` is a node, and an edge exists between two nodes if they are physically adjacent. Adjacency is determined by the `areZonesAdjacent` function, which checks if the GPS bounding boxes of two zones are touching or very close.
    2.  **Cost Function**: Each zone is assigned a traversal "cost" based on its current crowd density (`free`, `moderate`, `crowded`, `over-crowded`). Higher density means a higher cost.
    3.  **Pathfinding**: Dijkstra's algorithm explores the graph to find the path from the starting zone to the destination zone that has the lowest cumulative cost. This effectively steers the route away from crowded areas in favor of freer paths, even if they are slightly longer physically.
    4.  **Alternative Routes**: The system uses this algorithm twice: once to find the most direct physical path (ignoring congestion) and a second time to find the true optimal path (with congestion costs). If the two are different, it shows the user both the recommended route and the congested route that was avoided.

## 2. Ray-Casting Algorithm for Geolocation

- **Purpose**: To determine which `Zone` a user is currently inside based on their GPS coordinates.
- **Location**: `src/lib/actions.ts` in the `isPointInPolygon` function.
- **How it Works**:
    1.  **Point and Polygon**: The user's location is a single coordinate point (`lat`, `lng`), and each `Zone` is a polygon defined by a list of corner coordinates.
    2.  **Intersection Test**: The algorithm works by drawing a horizontal line extending infinitely to the right from the user's location. It then counts how many times this line intersects with the edges of the zone's polygon.
    3.  **Inside/Outside Determination**: If the number of intersections is odd, the point is inside the polygon. If the number of intersections is even, the point is outside. This provides a computationally efficient and accurate way to perform real-time zone identification without needing an external service.

## 3. Gemini (Large Language Model) for Density Classification

- **Purpose**: To classify the crowd density of a zone based on quantitative data.
- **Location**: `src/ai/flows/classify-zone-density.ts`.
- **How it Works**:
    1.  **Input Data**: The AI flow is given the zone's ID, its maximum capacity, and the current number of users inside it.
    2.  **Natural Language Prompt**: This data is embedded in a prompt that asks the Gemini model to act as a crowd management expert. The prompt instructs the model to classify the density into one of four categories: `over-crowded`, `crowded`, `moderate`, or `free`.
    3.  **AI-powered Reasoning**: The model uses its reasoning ability to make a judgment that is more nuanced than simple percentage thresholds. For example, it understands that a zone can feel "crowded" even if it's not at 100% capacity. It returns the chosen category and a brief justification for its decision.

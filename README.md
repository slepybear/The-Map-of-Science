# The Map of Science

## Project Philosophy / 项目理念

In an era where technology explodes at an unprecedented speed and scientific advancements emerge endlessly, our understanding of where these breakthroughs fit within the broader context of human knowledge remains unclear.

Scientists often focus on breaking through to the next frontier, but there is a gap in enabling the general public to grasp the landscape of cutting-edge knowledge. **The Map of Science** aims to bridge this gap.

Our mission is to create a system where **any ordinary person can understand the derivation of any new field—seeing clearly which previous fields it is built upon.**

In the future, we hope that the meaning and value of the most advanced frontier scientific research can be quickly understood by everyone. We believe this will:
*   Cultivate new science enthusiasts and practitioners.
*   Enable outsiders to quickly grasp scientific and technological knowledge.
*   Accelerate scientific progress.
*   Promote interdisciplinary exchange and innovation.

---

在这个科技大爆发的时代，各种科学进步层出不穷，但我们对这些科技进步的定位往往不够清晰。科学家们总是专注于突破下一个节点，但往往忽略了让大众也能掌握人类最前沿领域的知识定位。

**The Map of Science** 希望打造这样一个项目：让任何一个普通人都可以理解任何一个新领域是基于哪些前人领域的基础上发展而来的。

未来，我们希望最先进的前沿科学研究也能被任何普通人快速理解其意义和价值。这对培养新的科学爱好者从业者、让行外人快速领悟科技知识、加快科学进步以及促进跨学科交流都将起到巨大的推动作用。

## Project Overview

"The Map of Science" is an interactive scientific knowledge system visualization platform designed to systematically organize and present the entire scientific theory of human civilization in a dynamic tree diagram format.

## Core Features

1.  **Knowledge Graph**: A complete knowledge graph covering major scientific fields (Physics, Chemistry, Biology, Mathematics, Computer Science, etc.).
2.  **Derivation Chain Visualization**: Visualizes the complete derivation chain from basic principles to frontier theories.
3.  **Interactive Interface**: Supports expanding/collapsing nodes, dragging, zooming, and searching.
4.  **Smart Path Tracing**: Automatically highlights the derivation path from basic principles to a selected frontier theory.
5.  **Timeline View**: Displays the historical development of scientific theories.

## Project Structure

The project is organized as a monorepo containing both the frontend and backend services:

```
the-map-of-science/
├── backend/                # Node.js + Express + Neo4j Driver
│   ├── scripts/            # Database seeding scripts (e.g., seed.js, seed_cn.js)
│   ├── index.js            # Main application entry point
│   ├── utils.js            # Utility functions
│   └── Dockerfile          # Backend container configuration
├── frontend/               # React.js Application
│   ├── public/             # Static assets
│   ├── src/
│   │   ├── components/     # Reusable UI components (Graph, Timeline, Panels)
│   │   ├── pages/          # Application pages
│   │   ├── api.js          # API integration
│   │   └── App.js          # Main React component
│   └── Dockerfile          # Frontend container configuration
├── data/                   # Data persistence (Neo4j & Redis volumes)
├── docs/                   # Documentation
├── docker-compose.yml      # Orchestration for full stack (Frontend, Backend, Neo4j, Redis)
└── README.md               # Project documentation
```

## Development Environment & Setup

### Prerequisites
*   Docker & Docker Compose
*   Node.js (v18+) (Optional, for local non-Docker dev)

### Quick Start with Docker (Recommended)

1.  **Start the System**:
    ```bash
    docker-compose up -d --build
    ```

2.  **Access the Services**:
    *   **Frontend**: [http://localhost:3001](http://localhost:3001)
    *   **Backend API**: [http://localhost:5001](http://localhost:5001)
    *   **Neo4j Browser**: [http://localhost:7474](http://localhost:7474) (Default user: `neo4j`, password: `password`)

3.  **Initialize Data**:
    Run the seeding scripts to populate the database with initial scientific theories:
    ```bash
    docker exec map-of-science-backend npm run seed        # Basic English dataset
    docker exec map-of-science-backend npm run seed:cn     # Chinese dataset
    docker exec map-of-science-backend npm run seed:expanded # Expanded dataset
    ```
### How to try it
*   **You can try it on**: [https://build-five-dun.vercel.app/map](https://build-five-dun.vercel.app/map)


### Local Development (Without Docker)

If you prefer running services locally:

1.  **Backend**:
    ```bash
    cd backend
    npm install
    # Ensure a local Neo4j instance is running or update .env
    npm start
    ```

2.  **Frontend**:
    ```bash
    cd frontend
    npm install
    npm start
    ```

## Technical Architecture

*   **Frontend**: React.js with D3.js/Cytoscape.js for high-performance graph rendering (supporting 100k+ nodes).
*   **Backend**: Node.js/Express RESTful API.
*   **Database**: Neo4j (Graph Database) for storing complex knowledge relationships.
*   **Caching**: Redis for optimizing access to frequently queried nodes.

## Contributing

We welcome contributions! Whether you are a scientist, developer, or enthusiast, your input helps us map the world of science more accurately.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

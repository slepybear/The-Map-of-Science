# The Map of Science

## Project Overview
"The Map of Science" is an interactive scientific knowledge system visualization platform designed to systematically organize and present the entire scientific theory of human civilization in a dynamic tree diagram format.

## Core Features
1. **Knowledge Graph**: A complete knowledge graph covering major scientific fields (Physics, Chemistry, Biology, Mathematics, Computer Science, etc.).
2. **Derivation Chain Visualization**: Visualizes the complete derivation chain from basic principles to frontier theories.
3. **Interactive Interface**: Supports expanding/collapsing nodes, dragging, zooming, and searching.
4. **Smart Path Tracing**: Automatically highlights the derivation path from basic principles to a selected frontier theory.
5. **Timeline View**: Displays the historical development of scientific theories.

## How to Run

1. **Start the System**:
   ```bash
   docker-compose up -d --build
   ```

2. **Access the Application**:
   - **Frontend**: [http://localhost:3001](http://localhost:3001)
   - **Backend API**: [http://localhost:5001](http://localhost:5001)
   - **Neo4j Browser**: [http://localhost:7474](http://localhost:7474) (Username: `neo4j`, Password: `password`)

3. **Seed Initial Data**:
   ```bash
   docker exec map-of-science-backend npm run seed
   docker exec map-of-science-backend npm run seed:cn
   docker exec map-of-science-backend npm run seed:expanded
   ```

## Technical Requirements
- **Frontend**: D3.js or Cytoscape.js for high-performance rendering (supporting 100k+ nodes).
- **Backend**: Graph Database (Neo4j or ArangoDB) for storing knowledge.
- **API**: RESTful API for CRUD operations and path analysis.
- **Data Import**: Tools for batch importing from Wikidata, academic databases, etc.
- **Caching**: Redis for optimizing access to popular nodes.

## Data Structure
- **Nodes**: Theory Name, Description, Discipline, Discovery Time, Scientists, Formulas, Verification Status.
- **Relationships**: Derivation (A->B), Dependency (A basis for B), Development (A evolved to B).
- **Versioning**: History of modifications and academic controversies.

## User Experience
- Responsive Design (PC, Tablet, Mobile).
- Multiple Views (Tree, Network, Timeline, Discipline).
- Personalized Recommendations.
- Learning Modes (Beginner, Intermediate, Advanced).
- Multi-language Support (English, Chinese).

## Quality Assurance
- Performance: <3s response time for full graph load.
- Testing: Unit tests for algorithms, User testing with experts.
- Data Verification: Continuous audit mechanism.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

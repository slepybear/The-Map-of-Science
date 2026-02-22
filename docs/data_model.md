# Data Model

## Node Labels
- `Theory`
- `Scientist`
- `Discipline`

## Node Properties
### Theory
- `name`: String (Primary Key)
- `description`: String
- `discipline`: String
- `discovery_time`: String (YYYY-MM-DD)
- `formula`: String (LaTeX)
- `verification_status`: String (Confirmed, Theoretical, Disproven)

### Scientist
- `name`: String
- `field`: String
- `birth_year`: Integer

### Discipline
- `name`: String
- `description`: String

## Relationship Types
- `DERIVED_FROM`: (Theory) -> (Theory)
- `DEPENDS_ON`: (Theory) -> (Theory)
- `DISCOVERED_BY`: (Theory) -> (Scientist)
- `BELONGS_TO`: (Theory) -> (Discipline)

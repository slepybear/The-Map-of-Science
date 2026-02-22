# API Documentation

## Base URL
`http://localhost:5000/api`

## Endpoints

### 1. Get Theories
- **URL**: `/theories`
- **Method**: `GET`
- **Description**: Retrieves a list of theories.
- **Parameters**: `limit` (optional, default 25)
- **Response**:
  ```json
  [
    {
      "id": "Theory Name",
      "description": "...",
      "discipline": "Physics",
      ...
    }
  ]
  ```

### 2. Get Theory by ID
- **URL**: `/theories/:id`
- **Method**: `GET`
- **Description**: Retrieves details of a specific theory.

### 3. Create Theory
- **URL**: `/theories`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "name": "Theory Name",
    "description": "...",
    "discipline": "Physics"
  }
  ```

### 4. Create Relationship
- **URL**: `/relationships`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "source": "Theory A",
    "target": "Theory B",
    "type": "DERIVED_FROM"
  }
  ```

### 5. Path Tracing
- **URL**: `/path`
- **Method**: `GET`
- **Parameters**: `start` (theory ID), `end` (theory ID)
- **Response**: Path from start to end.

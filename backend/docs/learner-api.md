# Learner API Documentation

This document provides detailed information about the Learner-related API endpoints, including request and response formats, authentication requirements, and usage examples.

## Authentication
All endpoints require authentication via a Bearer token in the `Authorization` header. Only users with the `learner` role can access these routes.

---

## Endpoints

### 1. Get Learner Profile
- **GET** `/profile`
- **Description:** Retrieve the authenticated learner's profile.
- **Request:**
  - Headers: `Authorization: Bearer <token>`
- **Response:**
  - 200 OK: Learner profile object

### 2. Update Learner Profile
- **PUT** `/profile`
- **Description:** Update the authenticated learner's profile.
- **Request:**
  - Headers: `Authorization: Bearer <token>`
  - Body: JSON matching `updateProfile` schema (see validation)
- **Response:**
  - 200 OK: Updated profile object

### 3. Add Education
- **POST** `/education`
- **Description:** Add an education entry to the learner's profile.
- **Request:**
  - Headers: `Authorization: Bearer <token>`
  - Body: JSON with education details
- **Response:**
  - 201 Created: Updated education array

### 4. Add Skill
- **POST** `/skills`
- **Description:** Add a skill to the learner's profile.
- **Request:**
  - Headers: `Authorization: Bearer <token>`
  - Body: JSON with skill details
- **Response:**
  - 201 Created: Updated skills array

### 5. Get Credentials
- **GET** `/credentials`
- **Description:** Get all credentials for the learner.
- **Request:**
  - Headers: `Authorization: Bearer <token>`
- **Response:**
  - 200 OK: Array of credentials

### 6. Get Career Recommendations
- **GET** `/career-recommendations`
- **Description:** Get career recommendations based on learner's profile.
- **Request:**
  - Headers: `Authorization: Bearer <token>`
- **Response:**
  - 200 OK: Array of recommendations

### 7. Skill Gap Analysis
- **POST** `/skill-gap`
- **Description:** Analyze skill gaps for the learner.
- **Request:**
  - Headers: `Authorization: Bearer <token>`
  - Body: JSON with target career/skills
- **Response:**
  - 200 OK: Gap analysis result

### 8. Delete Account
- **DELETE** `/profile`
- **Description:** Delete the learner's account.
- **Request:**
  - Headers: `Authorization: Bearer <token>`
- **Response:**
  - 204 No Content

---

## Portfolio Endpoints

### 9. Create Portfolio
- **POST** `/portfolio/create`
- **Description:** Create a new portfolio for the learner.
- **Request:**
  - Headers: `Authorization: Bearer <token>`
  - Body: JSON with portfolio details
- **Response:**
  - 201 Created: Portfolio object

### 10. Share Portfolio
- **POST** `/portfolio/share`
- **Description:** Generate a share token for the portfolio.
- **Request:**
  - Headers: `Authorization: Bearer <token>`
  - Body: JSON with share options
- **Response:**
  - 200 OK: Share token

### 11. Get My Portfolio
- **GET** `/portfolio`
- **Description:** Retrieve the learner's portfolio.
- **Request:**
  - Headers: `Authorization: Bearer <token>`
- **Response:**
  - 200 OK: Portfolio object

### 12. Unshare Portfolio
- **POST** `/portfolio/unshare`
- **Description:** Revoke sharing of the portfolio.
- **Request:**
  - Headers: `Authorization: Bearer <token>`
- **Response:**
  - 200 OK: Unshare confirmation

### 13. Delete Portfolio
- **DELETE** `/portfolio`
- **Description:** Delete the learner's portfolio.
- **Request:**
  - Headers: `Authorization: Bearer <token>`
- **Response:**
  - 204 No Content

### 14. Portfolio Analytics
- **GET** `/analytics/views`
- **Description:** Get analytics for portfolio views.
- **Request:**
  - Headers: `Authorization: Bearer <token>`
- **Response:**
  - 200 OK: Analytics data

---

## Achievement Endpoints

### 15. Add Achievement
- **POST** `/achievements`
- **Description:** Add a new achievement.
- **Request:**
  - Headers: `Authorization: Bearer <token>`
  - Body: JSON with achievement details
- **Response:**
  - 201 Created: Achievement object

### 16. Get Achievements
- **GET** `/achievements`
- **Description:** Get all achievements for the learner.
- **Request:**
  - Headers: `Authorization: Bearer <token>`
- **Response:**
  - 200 OK: Array of achievements

### 17. Update Achievement
- **PUT** `/achievements/:id`
- **Description:** Update an existing achievement.
- **Request:**
  - Headers: `Authorization: Bearer <token>`
  - Body: JSON with updated achievement details
- **Response:**
  - 200 OK: Updated achievement object

### 18. Delete Achievement
- **DELETE** `/achievements/:id`
- **Description:** Delete an achievement by ID.
- **Request:**
  - Headers: `Authorization: Bearer <token>`
- **Response:**
  - 204 No Content

---

## Validation Schemas
- Profile update and other endpoints use validation schemas defined in `middleware/validation.js`.
- Refer to the codebase for exact schema details.

## Error Handling
- All endpoints return appropriate HTTP status codes and error messages in JSON format.
- Common error responses:
  - 400 Bad Request: Invalid input
  - 401 Unauthorized: Missing/invalid token
  - 403 Forbidden: Insufficient permissions
  - 404 Not Found: Resource not found
  - 500 Internal Server Error: Server error

---

## Example Request (cURL)
```
curl -X GET https://yourdomain.com/api/learner/profile \
  -H "Authorization: Bearer <token>"
```

---

For more details, see the controller and middleware files referenced in the route definitions.

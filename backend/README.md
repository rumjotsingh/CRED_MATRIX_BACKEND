
# National Micro-Credential Aggregator Platform - Backend

A production-ready backend system for managing micro-credentials across educational institutions, learners, and employers.

# CredMatrix Backend — Detailed API Reference

This file provides a detailed API reference, including endpoint descriptions, request bodies, and response bodies for the backend. It replaces scattered docs and provides quick examples for running and testing the main endpoints.

## Quick start

```bash
# Learner API - README

This README provides an overview of the Learner API endpoints, authentication, and usage instructions.

## Overview
The Learner API allows authenticated users with the `learner` role to manage their profile, education, skills, credentials, portfolio, and achievements. All endpoints are protected and require a valid JWT token.

## Authentication
- All requests must include an `Authorization: Bearer <token>` header.
- Only users with the `learner` role can access these endpoints.

## Endpoints Summary
| Method | Endpoint                   | Description                        |
|--------|----------------------------|------------------------------------|
| GET    | /profile                   | Get learner profile                |
| PUT    | /profile                   | Update learner profile             |
| POST   | /education                 | Add education                      |
| POST   | /skills                    | Add skill                          |
| GET    | /credentials               | Get credentials                    |
| GET    | /career-recommendations    | Get career recommendations         |
| POST   | /skill-gap                 | Skill gap analysis                 |
| DELETE | /profile                   | Delete account                     |
| POST   | /portfolio/create          | Create portfolio                   |
| POST   | /portfolio/share           | Share portfolio                    |
| GET    | /portfolio                 | Get my portfolio                   |
| POST   | /portfolio/unshare         | Unshare portfolio                  |
| DELETE | /portfolio                 | Delete portfolio                   |
| GET    | /analytics/views           | Portfolio analytics                |
| POST   | /achievements              | Add achievement                    |
| GET    | /achievements              | Get achievements                   |
| PUT    | /achievements/:id          | Update achievement                 |
| DELETE | /achievements/:id          | Delete achievement                 |

## Request & Response Details
- All requests and responses use JSON format.
- See [`docs/learner-api.md`](docs/learner-api.md) for detailed request/response examples and schemas, including required fields and sample payloads.

## Error Handling
- Standard HTTP status codes are used.
- Error responses are in JSON with an `error` message.

## Example Usage
```
GET /profile
Headers: Authorization: Bearer <token>
Response: 200 OK
{
	"name": "John Doe",
	"email": "john@example.com",
	...
}
```

## Further Reference
- See `controllers/learnerController.js` for business logic.
- See `middleware/validation.js` for validation schemas.

---

For questions or issues, contact the backend team.
### Update Institution
- **Endpoint:** `PUT /api/v1/institutions/:id` (institution, admin)
- **Description:** Updates institution details.
- **Request Body:** Fields to update (e.g., name, email)
- **Response Body:** Updated institution object.

### Delete Institution
- **Endpoint:** `DELETE /api/v1/institutions/:id` (admin)
- **Description:** Deletes an institution.
- **Request Body:** None
- **Response Body:**
	```json
	{ "success": true, "message": "Institution deleted successfully" }
	```

---

## Credentials

### Create Credential
- **Endpoint:** `POST /api/v1/credentials` (institution; multipart/form-data; file field `file`)
- **Description:** Creates a new credential (institution only, file upload).
- **Request Body:** Multipart/form-data with fields and file (field name: file).
- **Response Body:** Created credential object.

### List Credentials
- **Endpoint:** `GET /api/v1/credentials` (private; scoped by role)
- **Description:** Lists credentials (private, scoped by role).
- **Request Body:** None
- **Response Body:** List of credential objects.

### Get Credential
- **Endpoint:** `GET /api/v1/credentials/:id`
- **Description:** Returns details of a specific credential.
- **Request Body:** None
- **Response Body:** Credential object.

### Update Credential Metadata
- **Endpoint:** `PUT /api/v1/credentials/:id` (institution, admin)
- **Description:** Updates credential metadata.
- **Request Body:**
	```json
	{
		"title": "Updated title",
		"isPublic": true
	}
	```
- **Response Body:**
	```json
	{
		"success": true,
		"data": {
			"_id": "CRED_ID",
			"title": "Updated title"
		}
	}
	```

### Verify Credential
- **Endpoint:** `PUT /api/v1/credentials/:id/verify` (institution, admin)
- **Description:** Verifies a credential.
- **Request Body:** Verification details (if any).
- **Response Body:** Updated credential object.

### Delete Credential
- **Endpoint:** `DELETE /api/v1/credentials/:id` (institution, admin)
- **Description:** Deletes a credential.
- **Request Body:** None
- **Response Body:** Success message.

---

## Jobs (Employer)

### Create Job
- **Endpoint:** `POST /api/v1/employers/jobs/create` (employer)
- **Description:** Creates a new job posting.
- **Request Body:**
	```json
	{
		"title": "Frontend Dev",
		"requiredSkills": [{ "name": "React" }],
		"minNSQFLevel": 3
	}
	```
- **Response Body:** Created job object.

### List Jobs
- **Endpoint:** `GET /api/v1/employers/jobs` (employer)
- **Description:** Lists jobs posted by the employer.
- **Request Body:** None
- **Response Body:** List of job objects.

### Get Job
- **Endpoint:** `GET /api/v1/employers/jobs/:id`
- **Description:** Returns details of a specific job.
- **Request Body:** None
- **Response Body:** Job object.

### Update Job
- **Endpoint:** `PUT /api/v1/employers/jobs/:id` (employer)
- **Description:** Updates a job posting.
- **Request Body:** Fields to update.
- **Response Body:** Updated job object.

### Delete Job
- **Endpoint:** `DELETE /api/v1/employers/jobs/:id` (employer)
- **Description:** Deletes a job posting.
- **Request Body:** None
- **Response Body:** Success message.

---

## Portfolio (Learner)

### Create/Update Portfolio
- **Endpoint:** `POST /api/v1/learners/portfolio/create` (learner)
- **Description:** Creates or updates the learner's portfolio.
- **Request Body:** Portfolio details.
- **Response Body:** Portfolio object.

### Get My Portfolio
- **Endpoint:** `GET /api/v1/learners/portfolio` (learner)
- **Description:** Returns the authenticated learner's portfolio.
- **Request Body:** None
- **Response Body:** Portfolio object.

### Share Portfolio
- **Endpoint:** `POST /api/v1/learners/portfolio/share` (learner)
- **Description:** Generates a share token and URL for the portfolio.
- **Request Body:** None
- **Response Body:** Share token and URL.

### Unshare Portfolio
- **Endpoint:** `POST /api/v1/learners/portfolio/unshare` (learner)
- **Description:** Revokes the share token.
- **Request Body:** None
- **Response Body:** Success message.

### Delete Portfolio
- **Endpoint:** `DELETE /api/v1/learners/portfolio` (learner)
- **Description:** Deletes the learner's portfolio.
- **Request Body:** None
- **Response Body:** Success message.

### Public Portfolio View
- **Endpoint:** `GET /api/v1/learners/portfolio/:token` (public)
- **Description:** Publicly view a portfolio by share token.
- **Request Body:** None
- **Response Body:** Portfolio object.

---

## Talent Pool (Employer)

### Get Talent Pool
- **Endpoint:** `GET /api/v1/employers/talent-pool` (employer)
- **Description:** Returns the employer's talent pool.
- **Request Body:** None
- **Response Body:** List of learners.

### Add to Talent Pool
- **Endpoint:** `POST /api/v1/employers/talent-pool/add` (employer)
- **Description:** Adds a learner to the employer's talent pool.
- **Request Body:**
	```json
	{ "learnerId": "..." }
	```
- **Response Body:** Success message.

### Remove from Talent Pool
- **Endpoint:** `POST /api/v1/employers/talent-pool/remove` (employer)
- **Description:** Removes a learner from the employer's talent pool.
- **Request Body:**
	```json
	{ "learnerId": "LEARNER_ID" }
	```
- **Response Body:** Success message.

---

## Account Deletion

### Delete Learner Account
- **Endpoint:** `DELETE /api/v1/learners/profile` (learner)
- **Description:** Deletes learner record, credentials, portfolio, achievements, and user document.
- **Request Body:** None
- **Response Body:** Success message.

### Delete Employer Account
- **Endpoint:** `DELETE /api/v1/employers/profile` (employer)
- **Description:** Deletes employer record, jobs, talent pool, and user document.
- **Request Body:** None
- **Response Body:** Success message.

---

## Admin Endpoints

### Platform Stats
- **Endpoint:** `GET /api/v1/admin/stats` (admin)
- **Description:** Returns platform statistics.
- **Request Body:** None
- **Response Body:** Stats object.

### Manage Users
- **Endpoint:** `GET /api/v1/admin/users` (admin)
- **Description:** Lists all users.
- **Request Body:** None
- **Response Body:** List of users.

- **Endpoint:** `PUT /api/v1/admin/users/:id/status` (admin)
- **Description:** Updates a user's status.
- **Request Body:** Status update fields.
- **Response Body:** Updated user object.

- **Endpoint:** `DELETE /api/v1/admin/users/:id` (admin)
- **Description:** Deletes a user.
- **Request Body:** None
- **Response Body:** Success message.

### Verify Institution
- **Endpoint:** `PUT /api/v1/admin/institutions/:id/verify` (admin)
- **Description:** Verifies an institution.
- **Request Body:** Verification details (if any).
- **Response Body:** Updated institution object.

---

## Next steps

- I can generate an OpenAPI/Swagger spec from the routes, or add automated API tests. Which would you prefer?

---
This README consolidates route examples and replaces the older separate docs.
-- Rate limiting

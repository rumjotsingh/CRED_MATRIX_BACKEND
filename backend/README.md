# National Micro-Credential Aggregator Platform - Backend

A production-ready backend system for managing micro-credentials across educational institutions, learners, and employers.

# CredMatrix Backend — Consolidated API Reference

This file consolidates the API reference and example requests/responses for the backend. It replaces scattered docs and provides quick examples for running and testing the main endpoints.

## Quick start

```bash
npm install
npm start
```

Create `.env` from `.env.example` and configure MongoDB and Cloudinary credentials.

## Authentication

- Login: `POST /api/v1/auth/login`
- Register: `POST /api/v1/auth/register`

Example login request:

```bash
curl -X POST 'http://localhost:3000/api/v1/auth/login' \
	-H 'Content-Type: application/json' \
	-d '{"email":"user@example.com","password":"secret"}'
```

Response:

```json
{ "success": true, "token": "<JWT>", "data": { "user": { "id": "...", "role": "learner" } } }
```

Include the `Authorization: Bearer <JWT>` header for protected endpoints.

## Key endpoints & examples

All examples use `http://localhost:3000` and assume you set the proper `Authorization` header.

### Institutions

- List: `GET /api/v1/institutions`
- Get: `GET /api/v1/institutions/:id`
- Create: `POST /api/v1/institutions` (admin)
- Update: `PUT /api/v1/institutions/:id` (institution, admin)
- Delete: `DELETE /api/v1/institutions/:id` (admin)

Delete example (admin):

```bash
curl -X DELETE 'http://localhost:3000/api/v1/institutions/INST_ID' \
	-H 'Authorization: Bearer <ADMIN_JWT>'
```

Response:

```json
{ "success": true, "message": "Institution deleted successfully" }
```

### Credentials

- Create: `POST /api/v1/credentials` (institution; multipart/form-data; file field `file`)
- List: `GET /api/v1/credentials` (private; scoped by role)
- Get: `GET /api/v1/credentials/:id`
- Update metadata: `PUT /api/v1/credentials/:id` (institution, admin)
- Verify: `PUT /api/v1/credentials/:id/verify` (institution, admin)
- Delete: `DELETE /api/v1/credentials/:id` (institution, admin)

Update example:

```bash
curl -X PUT 'http://localhost:3000/api/v1/credentials/CRED_ID' \
	-H 'Authorization: Bearer <INSTITUTION_JWT>' \
	-H 'Content-Type: application/json' \
	-d '{"title":"Updated title","isPublic":true}'
```

Response (abridged):

```json
{ "success": true, "data": { "_id": "CRED_ID", "title": "Updated title" } }
```

### Jobs (Employer)

- Create: `POST /api/v1/employers/jobs/create` (employer)
- List: `GET /api/v1/employers/jobs` (employer)
- Get: `GET /api/v1/employers/jobs/:id`
- Update: `PUT /api/v1/employers/jobs/:id` (employer)
- Delete: `DELETE /api/v1/employers/jobs/:id` (employer)

Create example:

```bash
curl -X POST 'http://localhost:3000/api/v1/employers/jobs/create' \
	-H 'Authorization: Bearer <EMPLOYER_JWT>' \
	-H 'Content-Type: application/json' \
	-d '{"title":"Frontend Dev","requiredSkills":[{"name":"React"}],"minNSQFLevel":3}'
```

### Portfolio (Learner)

- Create/Update: `POST /api/v1/learners/portfolio/create` (learner)
- Get my portfolio: `GET /api/v1/learners/portfolio` (learner)
- Share (generate token): `POST /api/v1/learners/portfolio/share` (learner)
- Unshare: `POST /api/v1/learners/portfolio/unshare` (learner)
- Delete portfolio: `DELETE /api/v1/learners/portfolio` (learner)
- Public view: `GET /api/v1/learners/portfolio/:token` (public)

Get my portfolio example:

```bash
curl -H 'Authorization: Bearer <LEARNER_JWT>' 'http://localhost:3000/api/v1/learners/portfolio'
```

Share example (returns share token and URL):

```bash
curl -X POST 'http://localhost:3000/api/v1/learners/portfolio/share' \
	-H 'Authorization: Bearer <LEARNER_JWT>'
```

### Talent pool (Employer)

- Get: `GET /api/v1/employers/talent-pool`
- Add: `POST /api/v1/employers/talent-pool/add` `{ "learnerId": "..." }`
- Remove: `POST /api/v1/employers/talent-pool/remove` `{ "learnerId": "..." }`

Remove example:

```bash
curl -X POST 'http://localhost:3000/api/v1/employers/talent-pool/remove' \
	-H 'Authorization: Bearer <EMPLOYER_JWT>' \
	-H 'Content-Type: application/json' \
	-d '{"learnerId":"LEARNER_ID"}'
```

### Account deletion

- Learner: `DELETE /api/v1/learners/profile` — deletes learner record, credentials (and files), portfolio, achievements, and user document.
- Employer: `DELETE /api/v1/employers/profile` — deletes employer record, jobs, talent pool, and user document.

### Admin endpoints

- Platform stats: `GET /api/v1/admin/stats` (admin)
- Manage users: `GET /api/v1/admin/users`, `PUT /api/v1/admin/users/:id/status`, `DELETE /api/v1/admin/users/:id`
- Verify institution: `PUT /api/v1/admin/institutions/:id/verify`

## Next steps

- I can generate an OpenAPI/Swagger spec from the routes, or add automated API tests. Which would you prefer?

---
This README consolidates route examples and replaces the older separate docs.
- Rate limiting

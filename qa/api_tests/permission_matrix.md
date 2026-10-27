| Endpoint | anon | stu_member | stu_other | co_owner | co_other | supervisor | admin |
|---|---|---|---|---|---|---|---|
| `GET /` | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 |
| `POST /logout` | ✅ 401 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 |
| `GET /me` | ✅ 401 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 |
| `GET /users/me/profile` | ✅ 401 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 |
| `PUT /users/me/profile` | ✅ 401 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 |
| `PUT /users/me/skills` | ✅ 401 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 |
| `PUT /users/me/password (wrong current)` | ✅ 401 | ✅ 400 | ✅ 400 | ✅ 400 | ✅ 400 | ✅ 400 | ✅ 400 |
| `POST /users/me/cv-upload` | ✅ 401 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 |
| `GET /users/ (all users + emails/phones)` | ✅ 401 | ❌ 200 (exp deny) | ❌ 200 (exp deny) | ❌ 200 (exp deny) | ❌ 200 (exp deny) | ✅ 200 | ✅ 200 |
| `GET /users/?role=student` | ✅ 401 | ❌ 200 (exp deny) | ❌ 200 (exp deny) | ❌ 200 (exp deny) | ❌ 200 (exp deny) | ✅ 200 | ✅ 200 |
| `POST /projects/` | ✅ 401 | ✅ 201 | ✅ 201 | ✅ 201 | ✅ 201 | ✅ 201 | ✅ 201 |
| `GET /projects/my` | ✅ 401 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 |
| `GET /projects/` | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 |
| `GET /projects/{id} (approved)` | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 |
| `GET /projects/{id} (pending)` | ❌ 200 (exp deny) | ❌ 200 (exp deny) | ❌ 200 (exp deny) | ✅ 200 | ❌ 200 (exp deny) | ✅ 200 | ✅ 200 |
| `GET /projects/{id} (rejected)` | ❌ 200 (exp deny) | ❌ 200 (exp deny) | ❌ 200 (exp deny) | ✅ 200 | ❌ 200 (exp deny) | ✅ 200 | ✅ 200 |
| `PUT /projects/{id}` | ✅ 401 | ✅ 403 | ✅ 403 | ✅ 200 | ✅ 403 | ✅ 200 | ✅ 200 |
| `PUT /projects/{id}/status` | ✅ 401 | ✅ 403 | ✅ 403 | ✅ 403 | ✅ 403 | ✅ 200 | ✅ 200 |
| `PUT /projects/{id}/approve` | ✅ 401 | ✅ 403 | ✅ 403 | ✅ 403 | ✅ 403 | ✅ 200 | ✅ 200 |
| `DELETE /projects/{id}` | ✅ 401 | ✅ 403 | ✅ 403 | ✅ 204 | ✅ 403 | ✅ 204 | ✅ 204 |
| `POST /applications/` | ✅ 401 | ✅ 201 | ✅ 201 | ✅ 403 | ✅ 403 | ✅ 403 | ❌ 201 (exp deny) |
| `GET /applications/` | ✅ 401 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 |
| `GET /projects/{id}/applications` | ✅ 401 | ✅ 403 | ✅ 403 | ✅ 200 | ✅ 403 | ✅ 200 | ✅ 200 |
| `PUT /applications/{id}/status -> rejected` | ✅ 401 | ✅ 403 | ✅ 403 | ✅ 200 | ✅ 403 | ✅ 200 | ✅ 200 |
| `PUT /applications/{id}/status -> accepted` | ✅ 401 | ✅ 403 | ✅ 403 | ✅ 200 | ✅ 403 | ✅ 200 | ✅ 200 |
| `GET /projects/{id}/messages` | ✅ 401 | ✅ 200 | ✅ 403 | ✅ 200 | ✅ 403 | ✅ 200 | ✅ 200 |
| `POST /projects/{id}/messages` | ✅ 401 | ✅ 201 | ✅ 403 | ✅ 201 | ✅ 403 | ✅ 201 | ✅ 201 |
| `GET /notifications` | ✅ 401 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 |
| `PUT /notifications/{id}/read (student's)` | ✅ 401 | ✅ 200 | ✅ 404 | ✅ 404 | ✅ 404 | ✅ 404 | ✅ 404 |
| `PUT /notifications/read-all` | ✅ 401 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 |
| `GET /reports/` | ✅ 401 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 |
| `POST /reports/` | ✅ 401 | ✅ 201 | ❌ 201 (exp deny) | ✅ 403 | ✅ 403 | ✅ 403 | ❌ 201 (exp deny) |
| `PUT /reports/{id}/status` | ✅ 401 | ✅ 403 | ✅ 403 | ✅ 200 | ❌ 200 (exp deny) | ✅ 200 | ✅ 200 |
| `GET /analytics/overview` | ❌ 500 (exp allow) | ❌ 500 (exp allow) | ❌ 500 (exp allow) | ❌ 500 (exp allow) | ❌ 500 (exp allow) | ❌ 500 (exp allow) | ❌ 500 (exp allow) |

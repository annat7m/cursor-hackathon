## Person 1: Backend / Sandbox Runner

Goal: Make the backend actually execute submitted code in an isolated Docker container.

Work in: backend/

Tasks:

Add/finish an API endpoint like POST /api/run.
Input:
{ "code": "console.log('hello')" }
Output:
{
  "success": true,
  "stdout": "...",
  "stderr": "...",
  "latencyMs": 42
}
Use Docker to run code with strong limits: timeout, no host mounts, memory limit, no network if possible.
Make sure the frontend can call it from localhost:3000.
Success check:

curl -X POST http://localhost:8080/api/run \
  -H "Content-Type: application/json" \
  -d '{"code":"console.log(\"hello from sandbox\")"}'
## Person 2: Security Critic / Guardrails
Goal: Build the pre-flight scanner that approves or blocks code before execution.

Work in: backend/src/security/ or similar.

Tasks:

Create a function like analyzeCode(code).
Return:
{
  "safe": false,
  "risk_score": 90,
  "reason": "Uses process.env and attempts network access"
}
Detect obvious bad patterns:
eval
Function(...)
process.env
filesystem access like fs.readFile
network calls like fetch, http, net
shell execution like child_process
Integrate this into POST /api/run so unsafe code is blocked before Docker runs.
Success check:

curl -X POST http://localhost:8080/api/run \
  -H "Content-Type: application/json" \
  -d '{"code":"console.log(process.env.SECRET)"}'
Expected: blocked with a clear security reason.

## Person 3: Frontend / Demo Dashboard
Goal: Make the app look impressive and connect the Run button to the backend.

Work in: frontend/

Tasks:

Build the main dashboard UI:
code editor textarea or Monaco-style panel
Run button
Security Approved / Blocked badge
latency display
output console
security trace feed
Call POST http://localhost:8080/api/run.
Show different UI states:
scanning
approved
blocked
running
completed
error
Hardcode polished trace messages if needed, even before backend has all details.
Success check:

Open http://localhost:3000
Type code
Click Run
See approval/block status, output, and latency.
Everyone should agree on this one API shape now:

POST /api/run

Request:

{
  "code": "console.log('hello')"
}
Response:

{
  "safe": true,
  "risk_score": 12,
  "reason": "No risky patterns detected",
  "success": true,
  "stdout": "hello\n",
  "stderr": "",
  "latencyMs": 38
}
That lets all three people work independently without blocking each other.
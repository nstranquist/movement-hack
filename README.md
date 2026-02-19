# Movement hackathon

Submission for the movement hackathon in ethdenver.

Usually I'd only commit the ./submission folder, but since using agents exclusively is part of the requirements, I will include the entire working directory used with the agents.

## Human Notes

- added [chrome-devtools mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp) and script for seamless agentic debugging of browser console logs
- created a custom port of [Cursor Memory Bank](https://github.com/vanzan01/cursor-memory-bank) to claude code.
- secure secrets storage in AWS and utilizes infrastructure as code via terraform. This provides a scalable foundation for additional secure deployments to aws.
- all cloud deployments managed via cli using claude code agents.
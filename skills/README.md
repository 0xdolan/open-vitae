# Skills for AI assistants

[`open-vitae/`](open-vitae/SKILL.md) is a skill that teaches an AI assistant to write resumes Open Vitae can import: JSON that follows the published schema, Markdown and CSV, including right-to-left resumes in Persian, Arabic and Kurdish. It follows the open [Agent Skills](https://agentskills.io) layout (a folder with a `SKILL.md`), so it works with any assistant that reads that format.

| Assistant                            | Install                                                                                            |
| ------------------------------------ | -------------------------------------------------------------------------------------------------- |
| Claude Code                          | Copy `skills/open-vitae` to `~/.claude/skills/` (all projects) or `.claude/skills/` (one project)  |
| Claude apps                          | Zip the `open-vitae` folder and upload it as a skill in the app                                    |
| Codex, Gemini CLI, Cursor and others | Copy the folder where the tool looks for skills, or paste `SKILL.md` into the chat or a rules file |

Then ask, for example: “Turn my CV (attached) into an Open Vitae JSON file” or “Write my resume in Sorani for Open Vitae.” Import the result on the **My resumes** screen.

The examples in `open-vitae/examples/` are checked by the test suite, so they always import.

Rules for assistants that _change the code_ of Open Vitae are in [`AGENTS.md`](../AGENTS.md) and [`CLAUDE.md`](../CLAUDE.md).

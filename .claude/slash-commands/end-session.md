# End-Session

Execute the following tasks to properly end the work session:

1. Review and update the project_tracker.md file with:
   - Current completion status of any tasks worked on
   - Update progress percentages
   - Add notes about any partial work or blockers encountered
   - Update the "Current Status & Next Steps" section

2. Update the SESSION_CONTEXT.md file:
   - Update the "Last Updated" date to today
   - Update the "Current Phase" if it has changed
   - Add any significant changes to application state
   - Note any new beta testing progress or activities
   - Update test data or environment details if modified
   - Add session-specific notes that would help the next session
   - Ensure all key decisions or changes are documented

3. Check for any uncommitted changes:
   - Run `git status` to see all modified files
   - Stage all changes with `git add -A`
   - Create a descriptive commit message summarizing the session's work

4. Commit the changes with a clear message that includes:
   - What was accomplished in this session
   - Current state of any in-progress work
   - What the next steps are

5. Push changes to the remote repository

6. Provide a session summary to the user including:
   - Tasks completed
   - Current project progress
   - Any important notes for the next session
   - Confirmation that all changes are saved and pushed

Remember to stop any running development servers before ending the session.
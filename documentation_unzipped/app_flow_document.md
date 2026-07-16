# App Flow Document

## Onboarding and Sign-In/Sign-Up
A new user arrives at the SaaS platform by navigating to the landing page, which introduces the product and displays a clear call to action to sign up or sign in. The user clicks the Sign Up button and is presented with options to create an account using an email and password or to continue with Google or GitHub social login through Supabase Auth. If the user chooses email and password, they enter their email address, set a password, and submit the form. A confirmation email is sent and the user clicks the verification link to activate their account. If the user chooses Google or GitHub, they are redirected to the provider’s consent screen and then returned to the app with a valid session. Should the user forget their password, a Forgot Password link leads to a screen prompting them to enter their email so that a reset link can be sent. Clicking the reset link allows them to choose a new password and automatically sign them in. At any point after signing in, the user may access a profile menu in the header to sign out, which terminates the session and returns them to the landing page.

## Main Dashboard or Home Page
Upon successful sign-in or first-time verification, the user lands on the Organizations page, which serves as the main dashboard. Here, the user sees an overview panel showing existing organizations, each with its name, subscription status, and a button to enter the organization. If no organization exists, the user sees a prompt to create one by entering a name and optional description. After creating an organization, the user is immediately directed to create a workspace by providing a workspace name and pasting their n8n access token. Once the workspace is set up, the user is taken to the Home view, which displays a navigation sidebar on the left listing Workflows, Audit Trail, Key Management, Settings, and Billing. The top header shows the current organization and workspace, a user avatar with a dropdown for profile and sign out, and a button to switch organizations or workspaces. The central area highlights a welcome message and quick links to connect n8n or start building a workflow.

## Detailed Feature Flows and Page Transitions
When the user clicks Workflows in the sidebar, they enter the interactive canvas view. The screen is divided into two vertical panes: the left pane features an AI chat interface that adopts a friendly n8n orchestration assistant persona, and the right pane hosts the React Flow canvas showing existing workflow nodes. The user sends a natural language prompt in the chat, and the backend calls OmniRoute’s chat completions endpoint with structured function definitions. The AI returns a JSON payload invoking add_node(), update_node(), delete_node(), or connect_nodes(). The frontend parses this response and updates the canvas state via the Zustand store, causing the nodes and edges to appear or change visually with pulsing green borders for additions, orange borders for modifications, and faded red styling for deletions. The user may also drag and drop nodes directly on the canvas, connect handles by dragging edges from one node to another, or open a node’s properties panel by double-clicking it. Each direct manipulation is recorded in the same store and reflected in the AI chat transcript as user actions.

To deploy the edited workflow, the user clicks a Deploy button in the canvas header. The system compiles the JSON structure into the native n8n workflow schema, validates it, and sends it to the user’s self-hosted instance using the stored API token in the Authorization header. A success message appears and the workflow version is saved to the audit trail.

Administrators have access to the Audit Trail page. They select a workflow and browse historical snapshots stored as JSONB in Supabase. Each entry shows a timestamp and the triggering action. Clicking Restore on a snapshot triggers a POST request to the rollback endpoint, which authenticates the user, verifies row-level access, retrieves the JSONB snapshot, and sends it back to n8n via a PUT or MCP mutation. On success, the canvas refreshes to reflect the restored state.

## Settings and Account Management
In the Key Management section, the user can paste a new Base64-encoded AES key or upload a JSON key file. The system encrypts the provided key with the server’s master secret, stores it as a new version in the user_profiles table, and marks it active. Previous versions remain listed with timestamps for potential reactivation. The user may also revoke active keys or roll back to an older version.

The Settings page allows the user to update their profile information, change their password, configure notification preferences, and manage OAuth providers. In the Organization Settings tab, organization administrators can manage team members by inviting new users via email, assigning roles, and revoking access. The Billing section displays the organization’s Stripe subscription details, usage metrics, and an option to upgrade or cancel. Each settings screen includes a Back button in the header to return the user to the Home view or Workflows canvas without losing context.

## Error States and Alternate Paths
If a user submits an invalid email or password during sign-up, the form displays a validation message under the input field and disables the submit button until corrections are made. If the AI chat backend fails or returns an error, the chat pane shows an error message with a Retry button. In the canvas, if the compiled workflow JSON fails validation, a modal appears listing the validation errors inline with field highlights. Network connectivity issues trigger a banner at the top of the screen advising the user that they are offline and retry attempts are queued. Attempting to deploy without a valid n8n token causes an inline warning in the header prompting the user to update their key in Key Management. Unauthorized access or expired sessions redirect the user to the sign-in page with a message to reauthenticate.

## Conclusion and Overall App Journey
A typical user begins by signing up with Google or email and creating their first organization and workspace. After connecting their self-hosted n8n instance with an access token, they launch the split-pane canvas and issue natural language prompts to build or modify workflows. Visual feedback, AI-driven changes, and manual canvas edits combine seamlessly. Once satisfied, they deploy to n8n and can review or restore any version through the audit trail. Organization administrators handle team and billing tasks in the Settings, and all users benefit from encrypted key storage and secure role-based access. Over time, users iterate on workflows, rely on instant rollback, and scale their automation confidently with clear observability and governance.

```plaintext
Start
  |
Landing Page
  |
Sign Up / Sign In
  |
Email Flow or Social SSO Flow
  |
Email Verification or OAuth Callback
  |
Organization Creation
  |
Workspace Creation (Enter n8n Token)
  |
Main Dashboard (Home View)
  |
Select Workflows (Canvas View)
  |
AI Chat and Canvas Editing
  |      \
  |       Deploy Workflow
  |            |
  |       Success / Audit Save
  |
Audit Trail and Rollback
  |
Key Management / Settings / Billing
  |
Sign Out
```
# Temple Architecture - Complete App Specification Generator
## Paste into Miro → Fill in your app idea → Get ALL prompts for Lovable

---

## 🎯 HOW TO USE THIS TEMPLATE

1. **Copy this entire document**
2. **Paste into Miro** as separate sticky notes (one per section)
3. **Fill in the APP CONCEPT section** with your idea
4. **Work through each section** - each generates specific prompts
5. **Copy the generated prompts** to Lovable in order
6. **Build your complete app** following Temple Architecture

---

## 📝 SECTION 0: APP CONCEPT (START HERE)

```
═══════════════════════════════════════════════════════════════
APP IDEA INPUT
═══════════════════════════════════════════════════════════════

I WANT TO BUILD:
[e.g., "A Scheduling app for the construction industry"]

TARGET USERS:
[e.g., "Construction project managers, contractors, subcontractors"]

CORE PROBLEM IT SOLVES:
[e.g., "Managing multiple crews across job sites with conflicts and delays"]

SUCCESS LOOKS LIKE:
[e.g., "PM can schedule 20+ crews across 10 sites with zero conflicts"]

═══════════════════════════════════════════════════════════════
```

---

## 🏛️ SECTION 1: TEMPLE ARCHITECTURE MAPPING

Based on your app idea above, define your temple structure:

```
OUTER COURT (Entry & Simple Operations)
─────────────────────────────────────────
What are the simple, fast operations?

Examples for scheduling app:
• View today's schedule
• Check crew availability
• Quick crew status update

YOUR OUTER COURT:
1. _________________________________
2. _________________________________
3. _________________________________
4. _________________________________
5. _________________________________

LOVABLE PROMPT #1 (Outer Court):
"Create the Outer Court entry point for [YOUR APP]. Include:
- Authentication using Supabase Auth
- Request classification: simple operations (list above) vs complex
- Quick response endpoints for: [list your 1-5 above]
- Basic validation and error handling
- Route complex requests to Inner Court
- Use TypeScript and include proper types"


INNER COURT (Complex Orchestration)
─────────────────────────────────────────
What needs planning, coordination, or multiple steps?

Examples for scheduling app:
• Auto-schedule 50 tasks across crews
• Resolve scheduling conflicts
• Optimize crew allocation
• Multi-site planning

YOUR INNER COURT:
1. _________________________________
2. _________________________________
3. _________________________________
4. _________________________________

LOVABLE PROMPT #2 (Inner Court):
"Create the Inner Court orchestrator for [YOUR APP]. Include:
- Task planning system that breaks down complex requests
- Context builder that gathers: [relevant data for your app]
- Delegation logic to route to appropriate Priests
- Results aggregator that combines specialist outputs
- Integration with Supabase for data retrieval
- TypeScript interfaces for TaskPlan, ContextBundle, SubTask"


PRIESTS (Specialized Modules)
─────────────────────────────────────────
What are your 5-10 specialized domains?

Examples for scheduling app:
1. Schedule Priest - handles crew scheduling logic
2. Conflict Priest - detects and resolves conflicts
3. Resource Priest - manages equipment and materials
4. Notification Priest - alerts and reminders
5. Optimization Priest - finds best schedules
6. Report Priest - generates insights and reports

YOUR PRIESTS:
1. _____________ Priest (handles: _____________)
2. _____________ Priest (handles: _____________)
3. _____________ Priest (handles: _____________)
4. _____________ Priest (handles: _____________)
5. _____________ Priest (handles: _____________)
6. _____________ Priest (handles: _____________)
7. _____________ Priest (handles: _____________)

FOR EACH PRIEST, CREATE THIS PROMPT:

LOVABLE PROMPT #3a ([Priest Name] Priest):
"Create the [Priest Name] Priest for [YOUR APP]. This specialist handles: [what it handles].

Input Interface:
{
  subtask: {
    description: string
    inputs: {
      // Define specific inputs for this priest
    }
  }
  context: {
    // Relevant context data
  }
}

Output Interface:
{
  outputs: {
    // Define specific outputs
  }
  reasoning: string
  confidence_score: number
}

Logic:
[Describe the specific business logic this priest implements]

Use Supabase Edge Functions, TypeScript, and include proper error handling."

REPEAT FOR EACH PRIEST (3b, 3c, 3d, etc.)


SANCTUARY (Core Decision Logic)
─────────────────────────────────────────
What is the final synthesis/decision making?

Examples for scheduling app:
• Combine all priest recommendations
• Generate final schedule
• Provide explanation of decisions
• Trigger notifications

YOUR SANCTUARY:
_________________________________
_________________________________
_________________________________

LOVABLE PROMPT #4 (Sanctuary):
"Create the Sanctuary (core reasoning) for [YOUR APP]. Include:
- Synthesis logic that combines outputs from: [your priests]
- Final decision-making algorithm for: [your core use case]
- Response formatter that creates user-facing output
- Explanation generator that shows reasoning
- Action trigger logic for: [your River actions]
- Integration with LLM (OpenAI/Anthropic) for intelligent synthesis
- TypeScript with proper interfaces"


ARK (Governance & Rules)
─────────────────────────────────────────
What rules can NEVER be violated?

Examples for scheduling app:
• Never schedule same crew in two places at once
• Union rules: max 10 hour shifts
• Safety: minimum crew size of 2
• Budget: don't exceed project budget

YOUR ARK RULES:
1. _________________________________
2. _________________________________
3. _________________________________
4. _________________________________
5. _________________________________

LOVABLE PROMPT #5 (Ark):
"Create the Ark (governance) for [YOUR APP]. Include:

Policy Table Schema:
- policy_id, name, description
- check_type (pre/post)
- match_criteria (when to apply)
- handler_type (block/modify/warn)
- config (policy-specific rules)

Policies to implement:
[List your 1-5 rules above]

Pre-request checks: [which rules apply before processing]
Post-response checks: [which rules apply to outputs]

Include policy evaluation engine and Supabase integration."


RIVER (External Actions)
─────────────────────────────────────────
What actions flow out to external systems?

Examples for scheduling app:
• Send SMS notifications to crews
• Update Google Calendar
• Send email reports
• Webhook to accounting system
• Push notifications to mobile app

YOUR RIVER ACTIONS:
1. _________________________________
2. _________________________________
3. _________________________________
4. _________________________________
5. _________________________________

LOVABLE PROMPT #6 (River):
"Create the River (action dispatch) for [YOUR APP]. Include:

Action types:
[List your 1-5 actions above]

For each action type, create an adapter that:
- Accepts action payload
- Calls external API/service
- Handles retries on failure
- Logs success/failure
- Updates action status in database

Include:
- Supabase Edge Function for dispatch
- Action status tracking table
- TypeScript interfaces for each action type
- Error handling and retry logic"


MEMORY (What to Remember)
─────────────────────────────────────────
What context should persist?

Examples for scheduling app:
• User preferences (notification settings)
• Historical schedules
• Crew performance data
• Common conflicts and resolutions
• Project timelines and milestones

YOUR MEMORY STORES:
1. _________________________________
2. _________________________________
3. _________________________________
4. _________________________________
5. _________________________________

LOVABLE PROMPT #7 (Memory):
"Create the Memory system for [YOUR APP]. Include:

Tables:
- memory_items (for general context storage)
- user_preferences
- [other specific tables for your app]

Vector embeddings for semantic search of:
[Which data should be searchable semantically]

Functions:
- store_memory(user_id, type, content)
- retrieve_context(user_id, query, limit)
- update_preferences(user_id, preferences)

Use Supabase with pgvector extension for embeddings.
Include TypeScript interfaces."
```

---

## 📊 SECTION 2: DATA MODELS & DATABASE

```
CORE ENTITIES
─────────────────────────────────────────
List all the "things" in your app.

Examples for scheduling app:
• User (PM, contractor, crew member)
• Project (construction project)
• JobSite (physical location)
• Crew (group of workers)
• Task (work to be done)
• Schedule (assignment of crew to task)
• Equipment (tools, machinery)
• TimeEntry (hours worked)

YOUR ENTITIES:
1. _________________________________
2. _________________________________
3. _________________________________
4. _________________________________
5. _________________________________
6. _________________________________
7. _________________________________
8. _________________________________
9. _________________________________
10. ________________________________

FOR EACH ENTITY, DEFINE:

Entity: [NAME]
Fields:
- id: UUID
- [field_name]: [type]
- [field_name]: [type]
- created_at: timestamp
- updated_at: timestamp

Relationships:
- belongs_to: [other entity]
- has_many: [other entity]

LOVABLE PROMPT #8 (Database Schema):
"Create the complete Supabase database schema for [YOUR APP].

Include these tables:
[List all your entities 1-10 above]

For each table:
- Define all columns with appropriate types
- Set up foreign key relationships
- Create indexes for performance
- Add Row-Level Security (RLS) policies
- Include created_at and updated_at timestamps

Multi-tenancy:
- Isolate data by: [org_id / team_id / user_id as appropriate]
- RLS policies to enforce isolation

Also create:
- Enums for status fields
- Views for common queries
- Functions for complex operations

Provide the complete SQL migration file."


RELATIONSHIPS & CONSTRAINTS
─────────────────────────────────────────
How do your entities relate?

Examples for scheduling app:
• User -> Project (many-to-many via project_members)
• Project -> JobSite (one-to-many)
• JobSite -> Task (one-to-many)
• Task -> Crew (many-to-one)
• Crew -> User (many-to-many via crew_members)

YOUR RELATIONSHIPS:
1. _____ -> _____ (one-to-many / many-to-many)
2. _____ -> _____ (one-to-many / many-to-many)
3. _____ -> _____ (one-to-many / many-to-many)
4. _____ -> _____ (one-to-many / many-to-many)
5. _____ -> _____ (one-to-many / many-to-many)

CONSTRAINTS:
1. _________________________________
2. _________________________________
3. _________________________________

LOVABLE PROMPT #9 (Relationships):
"Add to the database schema:

Junction tables for many-to-many relationships:
[List your many-to-many relationships]

Constraints:
[List your constraints]

Cascade rules:
[Define what happens on delete - CASCADE, SET NULL, RESTRICT]

Include in the migration file with proper foreign key setup."
```

---

## 🎨 SECTION 3: UI/UX DESIGN

```
DESIGN SYSTEM
─────────────────────────────────────────

PRIMARY COLOR:
[e.g., "#FF6B35" - Construction Orange]

SECONDARY COLOR:
[e.g., "#004E89" - Professional Blue]

ACCENT COLOR:
[e.g., "#F77F00" - Warning/Alert Orange]

SUCCESS COLOR:
[e.g., "#06A77D" - Approval Green]

ERROR COLOR:
[e.g., "#D62828" - Error Red]

NEUTRAL COLORS:
- Background: [e.g., "#F8F9FA"]
- Text Primary: [e.g., "#212529"]
- Text Secondary: [e.g., "#6C757D"]
- Border: [e.g., "#DEE2E6"]

TYPOGRAPHY:
- Heading Font: [e.g., "Inter", sans-serif]
- Body Font: [e.g., "Inter", sans-serif]
- Monospace Font: [e.g., "JetBrains Mono"]

SPACING SCALE:
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- 2xl: 48px

BORDER RADIUS:
- sm: 4px
- md: 8px
- lg: 16px
- full: 9999px

SHADOWS:
- sm: [e.g., "0 1px 2px rgba(0,0,0,0.05)"]
- md: [e.g., "0 4px 6px rgba(0,0,0,0.1)"]
- lg: [e.g., "0 10px 15px rgba(0,0,0,0.1)"]

LOVABLE PROMPT #10 (Design System):
"Create a design system for [YOUR APP] using Tailwind CSS.

Configure tailwind.config.js with:

Colors:
- primary: [your primary color]
- secondary: [your secondary color]
- accent: [your accent color]
- success: [your success color]
- error: [your error color]
- Neutral scale: [your neutral colors]

Typography:
- Font families: [your fonts]
- Font sizes: text-xs to text-6xl
- Line heights: tight, normal, relaxed

Spacing:
[Your spacing scale]

Border radius:
[Your border radius values]

Shadows:
[Your shadow values]

Also create a global CSS file with:
- CSS variables for all colors
- Base styles for html, body
- Custom utility classes as needed

Include Google Fonts import for: [your fonts]"


COMPONENT LIBRARY
─────────────────────────────────────────
List all reusable UI components needed.

Examples for scheduling app:
• Button (primary, secondary, danger, ghost)
• Input (text, date, time, select)
• Card (for schedule items)
• Modal (for editing)
• Calendar view
• Crew card (shows crew info)
• Task card (shows task details)
• Timeline component
• Notification badge
• Status indicator (available, busy, offline)

YOUR COMPONENTS:
1. _________________________________
2. _________________________________
3. _________________________________
4. _________________________________
5. _________________________________
6. _________________________________
7. _________________________________
8. _________________________________
9. _________________________________
10. ________________________________
11. ________________________________
12. ________________________________

LOVABLE PROMPT #11 (Component Library):
"Create a reusable component library for [YOUR APP] in React with TypeScript.

Components to build:
[List your 1-12 components above]

For EACH component:
- Use TypeScript with proper prop interfaces
- Include variants/states as needed
- Follow design system (colors, spacing, etc.)
- Make it accessible (ARIA labels, keyboard nav)
- Include loading and error states
- Use Tailwind CSS for styling
- Export from @/components/ui/[component-name]

Create these in shadcn/ui style if possible, or custom if needed.

Start with: [your top 5 most important components]"
```

---

## 📱 SECTION 4: USER FLOWS & SCREENS

```
CORE USER FLOWS
─────────────────────────────────────────
What are the main user journeys?

Examples for scheduling app:
1. Create new schedule
2. Assign crew to task
3. Resolve scheduling conflict
4. View daily schedule
5. Update task status
6. Generate weekly report

YOUR CORE FLOWS:
1. _________________________________
2. _________________________________
3. _________________________________
4. _________________________________
5. _________________________________
6. _________________________________

FOR EACH FLOW, MAP IT OUT:

FLOW: [Name]
Steps:
1. User starts at: [screen/page]
2. User clicks/enters: [action]
3. System does: [backend action]
4. User sees: [response/new screen]
5. User can: [next actions]

LOVABLE PROMPT #12 (User Flow: [Name]):
"Implement the '[Flow Name]' user flow for [YOUR APP].

Screens needed:
[List screens involved]

For each screen, include:
- Page component with routing (React Router)
- Form handling (if applicable)
- API calls to Supabase
- Loading and error states
- Success/confirmation feedback
- Navigation to next screen

Flow:
[Describe the step-by-step flow]

Use TypeScript, React hooks, and Supabase client.
Include proper error handling and validation."

REPEAT FOR EACH CORE FLOW


SCREEN INVENTORY
─────────────────────────────────────────
List EVERY screen/page in your app.

Examples for scheduling app:
• Login / Sign up
• Dashboard (overview)
• Schedule (calendar view)
• Projects list
• Project detail
• Job sites list
• Job site detail
• Crews list
• Crew detail
• Tasks list
• Task detail
• Reports
• Settings
• Profile

YOUR SCREENS:
1. _________________________________
2. _________________________________
3. _________________________________
4. _________________________________
5. _________________________________
6. _________________________________
7. _________________________________
8. _________________________________
9. _________________________________
10. ________________________________
11. ________________________________
12. ________________________________
13. ________________________________
14. ________________________________
15. ________________________________

LOVABLE PROMPT #13 (All Screens):
"Create all screens/pages for [YOUR APP].

Screens to build:
[List all your screens 1-15 above]

For EACH screen:
1. Create React component in src/pages/[ScreenName].tsx
2. Set up routing in App.tsx
3. Include proper layout (header, sidebar, content area)
4. Add loading skeleton while data fetches
5. Add empty states (no data yet)
6. Add error states with retry button
7. Make it responsive (mobile, tablet, desktop)
8. Use components from component library
9. Fetch data from Supabase
10. Include navigation between screens

Protected routes (require auth):
[List which screens require authentication]

Public routes:
[List which screens are public]

Start with these priority screens: [top 5 most important]"


NAVIGATION STRUCTURE
─────────────────────────────────────────
How do users navigate?

Top Navigation:
□ Logo → [goes to]
□ Menu item: _____ → [goes to]
□ Menu item: _____ → [goes to]
□ Menu item: _____ → [goes to]
□ User menu → [dropdown with: Profile, Settings, Logout]

Side Navigation (if applicable):
□ _____ → [goes to]
□ _____ → [goes to]
□ _____ → [goes to]

Mobile Navigation:
□ Hamburger menu with: [list items]

LOVABLE PROMPT #14 (Navigation):
"Create the navigation system for [YOUR APP].

Top navigation bar:
[Describe your top nav structure]

Side navigation (if applicable):
[Describe your side nav structure]

Mobile navigation:
[Describe mobile nav with hamburger menu]

Include:
- Responsive design (show/hide based on screen size)
- Active state for current page
- User avatar and dropdown menu
- Logo that links to dashboard
- Smooth transitions
- TypeScript with React

Use Tailwind CSS and include accessibility features."
```

---

## 🔐 SECTION 5: AUTHENTICATION & AUTHORIZATION

```
AUTHENTICATION
─────────────────────────────────────────

AUTH METHODS:
□ Email + Password
□ Google OAuth
□ GitHub OAuth
□ Magic Link (passwordless)
□ Phone/SMS
□ Other: ___________

YOUR CHOICE: _______________________

LOVABLE PROMPT #15 (Authentication):
"Set up authentication for [YOUR APP] using Supabase Auth.

Auth methods to enable:
[Your choice from above]

Create these auth pages:
1. /login - Login form
2. /signup - Registration form
3. /forgot-password - Password reset
4. /reset-password - Set new password

Features:
- Email verification after signup
- Password strength indicator
- Remember me checkbox
- Social auth buttons (if applicable)
- Redirect to dashboard after login
- Error handling for invalid credentials
- Rate limiting for security

Include:
- Protected route wrapper component
- Auth context provider
- useAuth hook for accessing user
- Automatic token refresh

Use Supabase Auth with TypeScript."


AUTHORIZATION (Roles & Permissions)
─────────────────────────────────────────

USER ROLES:
Examples for scheduling app:
• Admin (full access)
• Project Manager (manage projects)
• Crew Lead (view and update own crew)
• Worker (view own schedule)

YOUR ROLES:
1. _____________ (can: _______________)
2. _____________ (can: _______________)
3. _____________ (can: _______________)
4. _____________ (can: _______________)

PERMISSIONS MATRIX:

Resource: [e.g., Schedule]
- Admin: Create, Read, Update, Delete
- PM: Create, Read, Update, Delete (own projects)
- Crew Lead: Read, Update (own crew)
- Worker: Read (own schedule)

YOUR PERMISSION MATRIX:
Resource: _____________
- [Role]: _______________
- [Role]: _______________
- [Role]: _______________

LOVABLE PROMPT #16 (Authorization):
"Set up role-based authorization for [YOUR APP].

Roles:
[List your roles 1-4]

Add to user_profiles table:
- role: enum (your roles)
- permissions: jsonb (optional fine-grained)

Row-Level Security policies for each table:
[For each main table, define who can read/write]

Example for [your main resource]:
- Admin: full access
- [Role 2]: [specific access]
- [Role 3]: [specific access]

Create RLS policies in Supabase.
Include permission checking hooks:
- usePermission(resource, action)
- Can component (render if user has permission)

Include TypeScript types for roles and permissions."
```

---

## 📡 SECTION 6: API & BACKEND LOGIC

```
API ENDPOINTS
─────────────────────────────────────────
List all API endpoints needed.

Examples for scheduling app:
POST   /api/schedules          - Create schedule
GET    /api/schedules/:id      - Get schedule
PUT    /api/schedules/:id      - Update schedule
DELETE /api/schedules/:id      - Delete schedule
GET    /api/schedules          - List schedules
POST   /api/schedules/optimize - Auto-optimize schedule
GET    /api/crews/available    - Get available crews
POST   /api/conflicts/resolve  - Resolve conflict

YOUR ENDPOINTS:
[Method] [Path] - [Purpose]
_______  _______________  - _______________
_______  _______________  - _______________
_______  _______________  - _______________
_______  _______________  - _______________
_______  _______________  - _______________
_______  _______________  - _______________
_______  _______________  - _______________
_______  _______________  - _______________
_______  _______________  - _______________
_______  _______________  - _______________

LOVABLE PROMPT #17 (API Endpoints):
"Create Supabase Edge Functions for all API endpoints in [YOUR APP].

Endpoints:
[List all your endpoints above]

For EACH endpoint:
1. Create function in supabase/functions/[name]
2. Define TypeScript request/response interfaces
3. Validate input with Zod or similar
4. Check user permissions
5. Execute business logic
6. Return proper status codes (200, 201, 400, 401, 403, 404, 500)
7. Include error handling
8. Log important events

Also create:
- OpenAPI/Swagger documentation
- TypeScript client SDK for frontend
- Proper CORS headers

Start with CRUD endpoints for: [your top 3 entities]"


BUSINESS LOGIC
─────────────────────────────────────────
What are your complex business rules?

Examples for scheduling app:
• Schedule optimization algorithm
• Conflict detection logic
• Crew availability calculation
• Resource allocation rules
• Budget tracking and alerts

YOUR BUSINESS LOGIC:
1. _________________________________
   Algorithm: _______________________
   Inputs: __________________________
   Outputs: _________________________

2. _________________________________
   Algorithm: _______________________
   Inputs: __________________________
   Outputs: _________________________

3. _________________________________
   Algorithm: _______________________
   Inputs: __________________________
   Outputs: _________________________

LOVABLE PROMPT #18 (Business Logic):
"Implement core business logic for [YOUR APP].

Create these utility functions/classes:

1. [Logic 1 Name]
   Purpose: [describe]
   Inputs: [list]
   Algorithm: [describe step by step]
   Outputs: [list]
   Error cases: [list]

2. [Logic 2 Name]
   [same structure]

3. [Logic 3 Name]
   [same structure]

Place in src/lib/[domain]/
Use TypeScript with proper types
Include unit tests for each function
Add JSDoc comments explaining the logic"


REAL-TIME FEATURES
─────────────────────────────────────────
What needs to update in real-time?

Examples for scheduling app:
• Schedule changes (show to all PMs)
• Crew status updates (available/busy)
• New task assignments
• Conflict alerts

YOUR REAL-TIME FEATURES:
1. _________________________________
2. _________________________________
3. _________________________________
4. _________________________________

LOVABLE PROMPT #19 (Real-time):
"Add real-time features to [YOUR APP] using Supabase Realtime.

Subscribe to changes on:
[List your real-time features]

For each feature:
1. Set up Supabase channel subscription
2. Listen for INSERT/UPDATE/DELETE events
3. Update UI optimistically
4. Show live indicator ("Live" badge)
5. Handle connection loss gracefully
6. Unsubscribe on component unmount

Example for [your top real-time feature]:
- Table: [table name]
- Events: [which events to listen for]
- UI update: [how to update the UI]

Include TypeScript types for real-time payloads."
```

---

## 🔔 SECTION 7: NOTIFICATIONS & ALERTS

```
NOTIFICATION TYPES
─────────────────────────────────────────

Examples for scheduling app:
• Task assigned to you
• Schedule changed
• Conflict detected
• Task deadline approaching
• Crew member called in sick
• Budget threshold exceeded

YOUR NOTIFICATIONS:
1. _____________ (trigger: ____________)
2. _____________ (trigger: ____________)
3. _____________ (trigger: ____________)
4. _____________ (trigger: ____________)
5. _____________ (trigger: ____________)

NOTIFICATION CHANNELS:
□ In-app (notification bell)
□ Email
□ SMS
□ Push (mobile)
□ Slack
□ Other: ____________

LOVABLE PROMPT #20 (Notifications):
"Create notification system for [YOUR APP].

Notification types:
[List your 1-5 notification types]

Channels:
[List your chosen channels]

Database schema:
- notifications table (id, user_id, type, title, body, read, created_at)
- notification_preferences table (user_id, channel, enabled)

Features:
1. In-app notification center with unread count
2. Mark as read/unread
3. Notification preferences page
4. Email notifications (using Resend or similar)
5. SMS notifications (using Twilio if selected)
6. Real-time notifications using Supabase Realtime

Create:
- Notification component (bell icon + dropdown)
- NotificationService to send notifications
- User preferences UI
- Email templates

Include TypeScript types and error handling."
```

---

## 📊 SECTION 8: REPORTING & ANALYTICS

```
REPORTS NEEDED
─────────────────────────────────────────

Examples for scheduling app:
• Daily schedule summary
• Weekly crew utilization
• Project progress report
• Budget vs actual hours
• Conflict resolution history

YOUR REPORTS:
1. _____________ (shows: ____________)
2. _____________ (shows: ____________)
3. _____________ (shows: ____________)
4. _____________ (shows: ____________)
5. _____________ (shows: ____________)

CHARTS/VISUALIZATIONS:
□ Line chart (for: _____________)
□ Bar chart (for: _____________)
□ Pie chart (for: _____________)
□ Calendar heatmap (for: _____________)
□ Gantt chart (for: _____________)
□ Table (for: _____________)

LOVABLE PROMPT #21 (Reporting):
"Create reporting and analytics for [YOUR APP].

Reports to build:
[List your 1-5 reports]

For each report:
1. SQL query to aggregate data
2. API endpoint to fetch report data
3. React component to display
4. Charts using Recharts or similar
5. Export to PDF/CSV functionality
6. Date range filters
7. Responsive design

Charts:
[List your chosen chart types]

Create:
- /reports page with report list
- /reports/[reportId] page for each report
- Report scheduling (optional)
- Email delivery of reports (optional)

Use Supabase for queries, TypeScript, and Recharts for viz."


ANALYTICS TRACKING
─────────────────────────────────────────
What user actions to track?

Examples for scheduling app:
• Schedule created
• Conflict resolved
• Report generated
• User invited teammate
• Mobile app opened

YOUR TRACKED EVENTS:
1. _____________ (tracks: ____________)
2. _____________ (tracks: ____________)
3. _____________ (tracks: ____________)
4. _____________ (tracks: ____________)
5. _____________ (tracks: ____________)

LOVABLE PROMPT #22 (Analytics):
"Add analytics tracking to [YOUR APP].

Events to track:
[List your 1-5 events]

Implementation:
1. Create analytics_events table (id, user_id, event, properties, timestamp)
2. Create track() function to log events
3. Add tracking calls throughout app
4. Create admin analytics dashboard
5. Show metrics: daily active users, feature usage, etc.

Optional: Integrate with Posthog or Mixpanel

Include TypeScript types for events."
```

---

## 🔍 SECTION 9: SEARCH & FILTERING

```
SEARCH FEATURES
─────────────────────────────────────────
What can users search for?

Examples for scheduling app:
• Search crews by name
• Search tasks by description
• Search projects by name
• Search job sites by address

YOUR SEARCH FEATURES:
1. Search _______ by _______
2. Search _______ by _______
3. Search _______ by _______
4. Search _______ by _______

FILTERS NEEDED:
□ Date range
□ Status (e.g., active, completed, cancelled)
□ Category/Type
□ Location
□ User/Owner
□ Tags
□ Other: ____________

LOVABLE PROMPT #23 (Search & Filters):
"Add search and filtering to [YOUR APP].

Search features:
[List your 1-4 search features]

Implement:
1. Search bar component with autocomplete
2. Full-text search using Postgres (or Supabase FTS)
3. Search API endpoint
4. Debounced search input
5. Search results display
6. Highlight matching text
7. Recent searches (optional)

Filters:
[List your chosen filters]

Create:
- FilterBar component with dropdowns/checkboxes
- Apply multiple filters simultaneously
- Clear all filters button
- Show active filter count
- Persist filters in URL query params

Use TypeScript, optimize for performance (index search columns)."
```

---

## 📱 SECTION 10: MOBILE RESPONSIVENESS

```
MOBILE EXPERIENCE
─────────────────────────────────────────

MOBILE-SPECIFIC FEATURES:
□ Bottom navigation instead of sidebar
□ Swipe gestures (e.g., swipe to delete)
□ Pull to refresh
□ Touch-optimized buttons (min 44px)
□ Mobile-specific layouts
□ Progressive Web App (PWA)

BREAKPOINTS:
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

LOVABLE PROMPT #24 (Mobile Responsive):
"Make [YOUR APP] fully responsive and mobile-friendly.

For ALL components and pages:
1. Use Tailwind responsive classes (sm:, md:, lg:)
2. Test on mobile (375px), tablet (768px), desktop (1440px)
3. Ensure buttons are at least 44px tall on mobile
4. Use mobile-friendly navigation (hamburger menu)
5. Optimize images (lazy load, responsive sizes)
6. Remove hover effects on touch devices
7. Test form inputs work well on mobile keyboards

Mobile-specific features:
[List selected features from above]

Create:
- MobileNav component
- BottomNav component (if needed)
- Responsive layouts for all pages
- Touch gesture handlers (if needed)

Test on real devices or use browser dev tools mobile emulation.

Optional: Convert to PWA with manifest.json and service worker."
```

---

## ⚡ SECTION 11: PERFORMANCE OPTIMIZATION

```
PERFORMANCE TARGETS
─────────────────────────────────────────

TARGETS:
- Initial load: < 3 seconds
- Time to interactive: < 5 seconds
- Largest Contentful Paint: < 2.5 seconds
- First Input Delay: < 100ms
- Cumulative Layout Shift: < 0.1

OPTIMIZATIONS NEEDED:
□ Code splitting (lazy load routes)
□ Image optimization
□ Database query optimization
□ Caching (React Query)
□ Debouncing/throttling
□ Virtual scrolling for long lists
□ Memoization (React.memo, useMemo)

LOVABLE PROMPT #25 (Performance):
"Optimize performance of [YOUR APP].

Implement:

1. Code Splitting:
   - Lazy load all routes
   - Lazy load heavy components
   - Use React.lazy() and Suspense

2. Image Optimization:
   - Use Next.js Image component (or similar)
   - Lazy load images below the fold
   - Serve WebP with fallback
   - Set explicit width/height

3. Database:
   - Add indexes to frequently queried columns
   - Use select() to fetch only needed columns
   - Implement pagination (not loading all data at once)
   - Cache expensive queries

4. React Query:
   - Set up React Query for data fetching
   - Configure stale time and cache time
   - Implement optimistic updates
   - Prefetch on hover

5. Virtual Scrolling:
   - For lists with > 100 items
   - Use react-window or similar

6. Memoization:
   - Wrap expensive calculations in useMemo
   - Wrap callbacks in useCallback
   - Use React.memo for pure components

Measure with Lighthouse and optimize until targets met."
```

---

## 🧪 SECTION 12: TESTING

```
TESTING STRATEGY
─────────────────────────────────────────

TYPES OF TESTS:
□ Unit tests (utilities, business logic)
□ Component tests (React Testing Library)
□ Integration tests (user flows)
□ E2E tests (Playwright/Cypress)
□ API tests (Edge Functions)

YOUR CRITICAL PATHS TO TEST:
1. _________________________________
2. _________________________________
3. _________________________________
4. _________________________________
5. _________________________________

LOVABLE PROMPT #26 (Testing):
"Set up testing for [YOUR APP].

Install:
- Vitest (for unit/component tests)
- React Testing Library
- Playwright (for E2E tests)

Unit tests:
- Test all utility functions in src/lib/
- Test business logic
- Target 80% coverage

Component tests:
- Test all components in src/components/
- Test user interactions (click, type, submit)
- Test loading and error states

E2E tests for critical paths:
[List your 1-5 critical paths]

For each critical path:
1. Write Playwright test
2. Test happy path
3. Test error cases
4. Test edge cases

Create:
- test/ directory structure
- CI/CD integration (run tests on PR)
- Coverage reports

Include TypeScript types for test utilities."
```

---

## 🔒 SECTION 13: SECURITY

```
SECURITY REQUIREMENTS
─────────────────────────────────────────

SECURITY CHECKLIST:
□ SQL injection prevention (use parameterized queries)
□ XSS prevention (sanitize user input)
□ CSRF protection
□ Rate limiting (prevent abuse)
□ Input validation (client and server)
□ Secure password storage (Supabase handles this)
□ HTTPS only
□ Environment variables for secrets
□ Content Security Policy
□ Secure headers

SENSITIVE DATA:
What data is sensitive?
1. _________________________________
2. _________________________________
3. _________________________________

How to protect:
- Encrypt at rest: [Y/N, how?]
- Encrypt in transit: [always HTTPS]
- Mask in UI: [which fields?]
- Audit access: [log who accessed what?]

LOVABLE PROMPT #27 (Security):
"Implement security best practices for [YOUR APP].

1. Input Validation:
   - Use Zod schemas for all API inputs
   - Validate on client AND server
   - Sanitize HTML input (use DOMPurify if allowing HTML)

2. Rate Limiting:
   - Implement rate limiting on API endpoints
   - Use Supabase Rate Limiting or custom solution
   - Limit: [X requests per minute per user]

3. SQL Injection:
   - Always use Supabase query builder (never string concat)
   - Use parameterized queries
   - Review all database queries

4. XSS Prevention:
   - Escape user-generated content
   - Use dangerouslySetInnerHTML only when necessary
   - Sanitize before rendering

5. CSRF:
   - Use Supabase Auth (handles CSRF tokens)
   - SameSite cookies

6. Secure Headers:
   - Content-Security-Policy
   - X-Frame-Options
   - X-Content-Type-Options
   - Strict-Transport-Security

7. Sensitive Data:
   - [List your sensitive data]
   - Encrypt: [specify which]
   - Mask in UI: [specify which]
   - Audit logging: [specify what to log]

8. Environment Variables:
   - Never commit .env to git
   - Use .env.example as template
   - Store secrets in Supabase dashboard

Create security.md documentation with all practices."
```

---

## 🚀 SECTION 14: DEPLOYMENT & CI/CD

```
DEPLOYMENT PLAN
─────────────────────────────────────────

HOSTING:
- Frontend: [e.g., Vercel, Netlify, Lovable]
- Backend: [e.g., Supabase]
- Database: [e.g., Supabase Postgres]

ENVIRONMENTS:
□ Development (local)
□ Staging (testing)
□ Production (live)

DOMAIN:
[e.g., app.yourcompany.com]

LOVABLE PROMPT #28 (Deployment):
"Set up deployment for [YOUR APP].

1. Supabase Setup:
   - Create production project
   - Run migrations
   - Deploy Edge Functions
   - Set environment variables
   - Configure custom domain (if needed)

2. Frontend Deployment:
   - Deploy to [your hosting choice]
   - Set environment variables:
     * VITE_SUPABASE_URL
     * VITE_SUPABASE_ANON_KEY
     * [any other vars]
   - Configure custom domain
   - Enable HTTPS
   - Set up redirects (SPA routing)

3. CI/CD Pipeline:
   - Create .github/workflows/deploy.yml
   - Run on: push to main
   - Steps:
     * Install dependencies
     * Run tests
     * Run linter
     * Build
     * Deploy to [hosting]
   - Notify on failure

4. Monitoring:
   - Set up error tracking (Sentry)
   - Set up uptime monitoring
   - Set up analytics (Posthog/Plausible)

5. Backup:
   - Daily database backups (Supabase Pro)
   - Backup rotation (7 days)

Provide deployment documentation in DEPLOYMENT.md"
```

---

## 📚 SECTION 15: DOCUMENTATION

```
DOCUMENTATION NEEDED
─────────────────────────────────────────

□ README.md (project overview, setup)
□ ARCHITECTURE.md (system design)
□ API.md (API documentation)
□ DEPLOYMENT.md (deployment guide)
□ CONTRIBUTING.md (for team/contributors)
□ User Guide (end-user documentation)
□ Admin Guide (admin-specific docs)

LOVABLE PROMPT #29 (Documentation):
"Create comprehensive documentation for [YOUR APP].

1. README.md:
   - Project description
   - Features list
   - Tech stack
   - Quick start guide
   - Environment variables
   - Available scripts
   - Folder structure
   - Contributing guide
   - License

2. ARCHITECTURE.md:
   - System architecture diagram
   - Temple structure breakdown
   - Data flow
   - Technology decisions
   - Database schema overview
   - API overview

3. API.md:
   - All endpoints documented
   - Request/response examples
   - Authentication
   - Error codes
   - Rate limits

4. docs/user-guide.md:
   - Getting started
   - Key features walkthrough
   - Screenshots/GIFs
   - FAQ
   - Troubleshooting

5. docs/admin-guide.md:
   - Admin features
   - User management
   - System configuration
   - Backups and recovery

Use clear language, include code examples, add diagrams."
```

---

## 🎯 SECTION 16: FEATURE PRIORITIZATION

```
MVP (Must Have for Launch)
─────────────────────────────────────────
What's absolutely essential?

YOUR MVP FEATURES:
1. _________________________________
2. _________________________________
3. _________________________________
4. _________________________________
5. _________________________________
6. _________________________________
7. _________________________________
8. _________________________________

PHASE 2 (Nice to Have)
─────────────────────────────────────────
What can wait until after launch?

YOUR PHASE 2:
1. _________________________________
2. _________________________________
3. _________________________________
4. _________________________________
5. _________________________________

PHASE 3 (Future)
─────────────────────────────────────────
What's for later?

YOUR PHASE 3:
1. _________________________________
2. _________________________________
3. _________________________________

LOVABLE PROMPT #30 (Implementation Order):
"Implement [YOUR APP] in phases.

PHASE 1 - MVP (Build First):
[List your MVP features 1-8]

Build in this order:
1. Database schema
2. Authentication
3. Core [main entity] CRUD
4. [Essential feature 1]
5. [Essential feature 2]
6. Basic UI/UX
7. Deploy to staging
8. Test and fix bugs
9. Deploy to production

PHASE 2 (Build After Launch):
[List Phase 2 features]

PHASE 3 (Future):
[List Phase 3 features]

Focus ONLY on Phase 1 for initial implementation.
Estimate: [X] weeks for MVP."
```

---

## 🎬 SECTION 17: FINAL ASSEMBLY PROMPTS

```
NOW THAT YOU'VE FILLED OUT ALL SECTIONS ABOVE,
USE THESE FINAL PROMPTS TO BUILD THE COMPLETE APP
─────────────────────────────────────────────────

LOVABLE PROMPT #31 (Project Initialization):
"Initialize a new project for [YOUR APP] following Temple Architecture.

1. Create project structure:
   ```
   /src
     /components (UI components)
       /ui (design system components)
     /pages (routes/screens)
     /lib (utilities and business logic)
       /supabase (Supabase client)
       /temple (Temple services)
     /hooks (custom React hooks)
     /types (TypeScript types)
   /supabase
     /functions (Edge Functions)
       /_shared (shared utilities)
       /outer-court
       /inner-court
       /priests
       /sanctuary
       /ark
       /memory
       /river
     /migrations (SQL migrations)
   ```

2. Install dependencies:
   - React + TypeScript
   - Tailwind CSS
   - Supabase
   - React Router
   - React Query
   - Zod (validation)
   - Recharts (if using charts)
   - Date-fns (date handling)
   - [Any other deps from your sections above]

3. Configure:
   - TypeScript (strict mode)
   - Tailwind (with your design system)
   - ESLint + Prettier
   - Vite (or build tool)

4. Create .env.example with:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY
   - [Any other vars]

Provide complete package.json and config files."


LOVABLE PROMPT #32 (Complete Type Definitions):
"Create all TypeScript type definitions for [YOUR APP].

Create src/types/index.ts with:

1. Temple Architecture types:
   - RawRequest
   - ClassifiedRequest
   - TaskPlan
   - Subtask
   - ContextBundle
   - FinalResponse
   - ActionRecord
   - PolicyCheckResult

2. Domain types (your entities):
   [List all your entities from Section 2]

3. API types:
   - API request/response for each endpoint
   - Error response type

4. UI types:
   - Component prop types
   - Form data types
   - Filter/search types

5. Auth types:
   - User
   - Session
   - Role
   - Permission

Export all from src/types/index.ts"


LOVABLE PROMPT #33 (Database + All Edge Functions):
"Create the complete backend for [YOUR APP].

1. Run Prompt #8 (Database Schema) first
2. Run Prompt #9 (Relationships) next
3. Deploy all Temple services:
   - Prompt #1 (Outer Court)
   - Prompt #2 (Inner Court)
   - Prompts #3a-3g (All Priests)
   - Prompt #4 (Sanctuary)
   - Prompt #5 (Ark)
   - Prompt #6 (River)
   - Prompt #7 (Memory)
4. Create all API endpoints (Prompt #17)
5. Implement business logic (Prompt #18)

Deploy to Supabase and test each service."


LOVABLE PROMPT #34 (Complete Frontend):
"Build the complete frontend for [YOUR APP].

1. Design System (Prompt #10)
2. Component Library (Prompt #11)
3. All Screens (Prompt #13)
4. Navigation (Prompt #14)
5. Authentication UI (Prompt #15)
6. Implement all user flows (Prompt #12)
7. Add real-time (Prompt #19)
8. Add notifications (Prompt #20)
9. Add search/filters (Prompt #23)
10. Make responsive (Prompt #24)
11. Add reporting (Prompt #21)

Test each screen thoroughly.
Ensure all flows work end-to-end."


LOVABLE PROMPT #35 (Polish & Launch):
"Final polish for [YOUR APP] before launch.

1. Performance (Prompt #25)
   - Run Lighthouse
   - Optimize until scores > 90

2. Security (Prompt #27)
   - Security audit
   - Fix all vulnerabilities

3. Testing (Prompt #26)
   - Write tests for critical paths
   - Achieve > 80% coverage

4. Documentation (Prompt #29)
   - Complete all docs

5. Deployment (Prompt #28)
   - Deploy to production
   - Set up monitoring
   - Set up backups

6. Final checks:
   - Test on real devices
   - Test all user flows
   - Fix all bugs
   - Load test with realistic data

LAUNCH! 🚀"
```

---

## ✅ MASTER CHECKLIST

```
USE THIS TO TRACK YOUR PROGRESS
─────────────────────────────────────────

PLANNING (Sections 0-16):
□ Section 0: App Concept Defined
□ Section 1: Temple Architecture Mapped
□ Section 2: Data Models Designed
□ Section 3: UI/UX Designed
□ Section 4: User Flows Mapped
□ Section 5: Auth/Authz Planned
□ Section 6: API Designed
□ Section 7: Notifications Planned
□ Section 8: Reporting Planned
□ Section 9: Search Planned
□ Section 10: Mobile Planned
□ Section 11: Performance Planned
□ Section 12: Testing Planned
□ Section 13: Security Planned
□ Section 14: Deployment Planned
□ Section 15: Docs Planned
□ Section 16: Prioritized

IMPLEMENTATION (Prompts 1-35):
□ Prompts 1-7: Temple Backend
□ Prompt 8-9: Database
□ Prompt 10-11: Design System
□ Prompt 12-14: Core UI
□ Prompt 15-16: Auth
□ Prompt 17-19: APIs & Real-time
□ Prompt 20-22: Notifications & Analytics
□ Prompt 23-24: Search & Mobile
□ Prompt 25: Performance
□ Prompt 26: Testing
□ Prompt 27: Security
□ Prompt 28: Deployment
□ Prompt 29: Documentation
□ Prompts 31-35: Final Assembly

LAUNCH:
□ All features working
□ All tests passing
□ Security audit complete
□ Documentation complete
□ Deployed to production
□ Monitoring active
□ Team trained
□ LAUNCHED! 🎉
```

---

## 🎯 USAGE INSTRUCTIONS

### FOR QUICK APPS (1-2 weeks):
1. Fill out Sections 0-1 only
2. Use Prompts 31-35 (skip detailed prompts)
3. Let Lovable AI make design decisions
4. MVP in days

### FOR PRODUCTION APPS (1-3 months):
1. Fill out ALL sections (0-16)
2. Use ALL prompts (1-35) in order
3. Review each generated code
4. Test thoroughly
5. Launch with confidence

### FOR ENTERPRISE APPS (3-6 months):
1. Fill out ALL sections with stakeholders
2. Use ALL prompts
3. Add custom prompts for specific needs
4. Multiple review cycles
5. Staged rollout

---

END OF SPECIFICATION GENERATOR

This template ensures you think through EVERY aspect
of your application before a single line of code is written.

The prompts are designed to be passed directly to Lovable
or any AI coding assistant for complete implementation.

Good luck building! 🏛️

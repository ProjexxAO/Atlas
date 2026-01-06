# Temple Architecture - Miro Board Layout Guide
## Visual guide for setting up your Miro board

---

## OPTION 1: HORIZONTAL FLOW LAYOUT

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  🏛️ [YOUR APP NAME] - TEMPLE ARCHITECTURE                    Date: ___________  │
│  Owner: _____________  Status: Planning/Building/Launched                       │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐      ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  OUTER COURT │ ───> │ INNER COURT  │ ───> │   PRIESTS    │ ───> │  SANCTUARY   │
│   (Blue)     │      │   (Green)    │      │  (Yellow)    │      │  (Purple)    │
├──────────────┤      ├──────────────┤      ├──────────────┤      ├──────────────┤
│              │      │              │      │ 1.__________ │      │              │
│ Auth         │      │ Planning     │      │ 2.__________ │      │ Synthesis    │
│ Classify     │      │ Context      │      │ 3.__________ │      │ Decisions    │
│ Simple QA    │      │ Delegate     │      │ 4.__________ │      │ Response     │
│              │      │              │      │ 5.__________ │      │              │
│ MY OUTER:    │      │ MY INNER:    │      │ 6.__________ │      │ MY SANCTUARY:│
│ □________    │      │ □________    │      │ 7.__________ │      │ □________    │
│ □________    │      │ □________    │      │              │      │ □________    │
└──────────────┘      └──────────────┘      └──────────────┘      └──────────────┘
                                                    │
                                                    ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  ARK/COVENANT│ <─── │              │      │    RIVER     │
│    (Red)     │      │              │      │   (Teal)     │
├──────────────┤      │              │      ├──────────────┤
│              │      │              │      │              │
│ Policies     │      │              │      │ Email        │
│ Rules        │      │              │      │ Slack        │
│ Governance   │      │              │      │ API Calls    │
│              │      │              │      │ Webhooks     │
│ MY ARK:      │      │              │      │ MY RIVER:    │
│ 1.________   │      │              │      │ □________    │
│ 2.________   │      │              │      │ □________    │
└──────────────┘      └──────────────┘      └──────────────┘

┌──────────────────────────────────────────────────────────┐
│              MEMORY / STOREHOUSE (Orange)                │
│                    (Bottom of board)                     │
├──────────────────────────────────────────────────────────┤
│  User Data    │  Context    │  History    │  Knowledge  │
│  □_________   │  □_________  │  □_________  │  □_________│
└──────────────────────────────────────────────────────────┘
```

---

## OPTION 2: VERTICAL TEMPLE LAYOUT (More Visual)

```
                    ┌─────────────────────┐
                    │    USER / CLIENT    │
                    │   (Person Icon)     │
                    └──────────┬──────────┘
                               │
                               ▼
        ╔══════════════════════════════════════════╗
        ║        OUTER COURT (Blue Frame)         ║
        ║  Authentication, Classification, QA     ║
        ╚══════════════════╤═══════════════════════╝
                           │
                   (Simple)│(Complex)
                           ▼
        ╔══════════════════════════════════════════╗
        ║       INNER COURT (Green Frame)         ║
        ║   Planning, Context, Orchestration      ║
        ╚══════════════════╤═══════════════════════╝
                           │
        ┌──────────────────┴──────────────────┐
        ▼                  ▼                  ▼
    ┌───────┐         ┌───────┐         ┌───────┐
    │PRIEST │         │PRIEST │   ...   │PRIEST │
    │  #1   │         │  #2   │         │  #N   │
    └───┬───┘         └───┬───┘         └───┬───┘
        └──────────────────┼──────────────────┘
                           ▼
        ╔══════════════════════════════════════════╗
        ║       SANCTUARY (Purple Frame)          ║
        ║      Core Logic & Synthesis             ║
        ╚══════════════════╤═══════════════════════╝
                           │
                           ▼
        ╔══════════════════════════════════════════╗
        ║       ARK / COVENANT (Red Frame)        ║
        ║         Policy Enforcement              ║
        ╚══════════════════╤═══════════════════════╝
                           │
                           ▼
        ╔══════════════════════════════════════════╗
        ║          RIVER (Teal Frame)             ║
        ║         Action Dispatch                 ║
        ╚══════════════════╤═══════════════════════╝
                           │
                           ▼
                    ┌──────────────┐
                    │  EXTERNAL    │
                    │   SYSTEMS    │
                    └──────────────┘

        ╔══════════════════════════════════════════╗
        ║    MEMORY / STOREHOUSE (Orange)         ║
        ║      (Connects to all levels)           ║
        ╚══════════════════════════════════════════╝
```

---

## OPTION 3: DASHBOARD LAYOUT (Best for teams)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  APP HEADER: Name, Owner, Status, Last Updated                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┬──────────────────────┬──────────────────────────────┐
│  ARCHITECTURE        │  DATA FLOW           │  TECH STACK                  │
│  (7 Temple Chambers) │  (Journey Maps)      │  (Icons/Logos)               │
│                      │                      │                              │
│  Outer  →  Inner     │  Simple: ___sec      │  Frontend: _______           │
│  Priests → Sanctuary │  Complex: ___sec     │  Backend: _______            │
│  Ark    →  River     │                      │  Database: _______           │
│  Memory (all)        │  [Draw flows]        │  AI/APIs: _______            │
└──────────────────────┴──────────────────────┴──────────────────────────────┘

┌──────────────────────┬──────────────────────┬──────────────────────────────┐
│  PRIESTS DETAIL      │  DATA MODELS         │  API ENDPOINTS               │
│                      │                      │                              │
│  1. Life             │  User                │  POST /api/v1/entry          │
│  2. Strategy         │  Request             │  POST /api/v1/orchestrate    │
│  3. Finance          │  Context             │  POST /api/v1/priests/{id}   │
│  4. _______          │  Response            │  POST /api/v1/actions        │
│  5. _______          │  _______             │  GET  /api/v1/memory         │
└──────────────────────┴──────────────────────┴──────────────────────────────┘

┌──────────────────────┬──────────────────────┬──────────────────────────────┐
│  SECURITY & POLICIES │  METRICS             │  TIMELINE                    │
│                      │                      │                              │
│  Auth: _______       │  Latency: ___ms      │  MVP:  Week ___              │
│  RLS: Y/N            │  Errors: ___%        │  Beta: Week ___              │
│  Encryption: Y/N     │  Cost: $___/mo       │  Launch: _______             │
│  Tenants: P/T/O      │  Users: ___          │  Scale: _______              │
└──────────────────────┴──────────────────────┴──────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  DECISIONS LOG                                                              │
│  [Date] Decision: ___________  Rationale: ___________                       │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  OPEN QUESTIONS / RISKS                                                     │
│  □ Question/Risk 1...                                                       │
│  □ Question/Risk 2...                                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## HOW TO CREATE IN MIRO

### Step 1: Choose Your Layout
- **Horizontal Flow**: Best for technical teams, shows data flow clearly
- **Vertical Temple**: Most visual, best for presentations
- **Dashboard**: Best for ongoing projects, all info at a glance

### Step 2: Create Frames
1. Press `F` or click Frame tool
2. Create 7 colored frames (one for each temple section):
   ```
   Outer Court  → Blue (#0066FF)
   Inner Court  → Green (#00CC66)
   Priests      → Yellow (#FFCC00)
   Sanctuary    → Purple (#9933FF)
   Ark          → Red (#FF3333)
   River        → Teal (#00CCCC)
   Memory       → Orange (#FF9933)
   ```

### Step 3: Add Content
- **Text boxes**: Press `T` for each card
- **Sticky notes**: Press `N` for quick ideas
- **Shapes**: Press `S` for database, APIs, users
- **Arrows**: Press `A` to show data flow

### Step 4: Add Icons
Search for:
- 🏛️ Temple (title)
- 👤 User (entry point)
- 🔐 Lock (security)
- 📊 Chart (metrics)
- 🎯 Target (goals)

### Step 5: Color Code
- **Blue sticky notes**: To-do items
- **Green sticky notes**: Completed
- **Yellow sticky notes**: Questions
- **Red sticky notes**: Risks/blockers
- **Purple sticky notes**: Decisions made

### Step 6: Add Connections
Draw arrows to show:
- Data flow (solid arrows →)
- Dependencies (dashed arrows ⇢)
- Alternative paths (dotted arrows ··>)

---

## MIRO HOTKEYS CHEAT SHEET

```
T = Text box
N = Sticky note
F = Frame
S = Shape
A = Arrow
C = Comment
/ = Search all tools
CMD+D = Duplicate
CMD+G = Group
CMD+Z = Undo
```

---

## BEST PRACTICES

### Do's:
✅ Use frames to group related items
✅ Color code consistently
✅ Add dates to decisions
✅ Link to external docs
✅ Take screenshots for milestones
✅ Share with team for feedback

### Don'ts:
❌ Don't overcrowd - use multiple boards if needed
❌ Don't use too many fonts
❌ Don't make text too small (min size 12)
❌ Don't forget to save as template
❌ Don't skip the "7 Questions" card

---

## TEMPLATE SIZES

**Quick Planning Session** (1 board):
- Use Option 3 (Dashboard)
- 30 min to fill out
- Good for MVPs

**Deep Architecture** (2-3 boards):
- Board 1: Overview (Option 1)
- Board 2: Detailed Priests
- Board 3: Data models & flows
- 2-3 hours to complete
- Good for production apps

**Living Documentation** (Project):
- Create Miro Project
- Multiple boards for each phase
- Update as you build
- Good for complex systems

---

## SHARING TIPS

**For Team Review:**
1. Export as PDF
2. Add comments for questions
3. Present in presentation mode
4. Record a Loom walkthrough

**For Stakeholders:**
1. Use high-level view (zoom out)
2. Hide technical details
3. Focus on user flows
4. Show timeline clearly

**For Developers:**
1. Include all technical details
2. Link to GitHub/Jira
3. Add API specs
4. Include example requests

---

## SAVE AS TEMPLATE

1. Click board name
2. Select "Save as template"
3. Name: "Temple Architecture - [Your Org]"
4. Set as default for new projects
5. Share template link with team

---

## MOBILE TIP

Miro mobile app works great for:
- Reviewing boards
- Adding quick notes
- Voting on decisions
- Checking progress

Less good for:
- Initial setup (use desktop)
- Complex diagrams (use desktop)

---

END OF LAYOUT GUIDE

Pick the layout that fits your team,
create it once as a template,
and reuse for every new project! 🏛️

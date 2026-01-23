### To do

Change date range selector to be more like the image: have its own row, dates on RH side

- Read full repo
- Test all functionality
- Go through each page, test for UI; afterwards, do full CC sweep to ensure consistency

Did: data loads to page so no lag when you go back to dashboard; switched date picker to shadcn date range; tried to fix the dropdown and calendar background color (transparent), said it was caused by this: "You're using Tailwind CSS v4, which has a completely different configuration system. The color mappings in your tailwind.config.js are being ignored because Tailwind v4 uses the @theme directive in CSS instead." so combing through tailwind implementation since that's probably what's fucking it up. That fixed the background colors. Also, connected to chrome dev tools mcp, so clutch. Impossible for web dev without.

### General

- **Data types**: Why don't all data types in index.ts have created at, updated at, deleted at?
- **Fix dropdowns**: Still transparent
- **Color**: Maybe add some color back, but make it very intentional
- **Privacy**: Best method for encryption / privacy for budget app? Want friends to feel more secure that I can’t just see all their transactions. Encrypted db?
- **Data loading**: Still takes a sec to load for add transactions, goals. Want all data reuqired for any page loaded when user gets to Dashboard.

- **Keyboard shortcuts**
  - Input transactions: tab next, enter down, control enter submit
  - Shortcut to get to each page
  - For every user action, make keyboard shortcut

### Navbar

- **Text**: Don't like how text spills to 2 lines - change font size, or just icon, or something
- **Search bar**: Change search bar to be the AI assistant, want it clickable + very visible from navbar
  - Make it take up more space on navbar
  - Give it suggested message placeholders that rotate every few seconds
  - Only thing with color?
  - What model to use?
  - How to make it an agent? Use langgraph?
  - How to store all messages for logging?
- **Categorize after startup**
  - I want the first thing users to do when they sign up is to copy/paste their transaction history into AI chatbot
  - How to ensure it gets them all right, first try, without any user data?
  - Maybe collect data on all user first-tries, see what they change up

### Dashboard

- **Calendar**: number dates look ugly, where to put cal
- **Tables**: cols still look weird
- **Sankey**: Fix colors, text overlaps, don't like the savings bar - just eliminate
- **Date range selector**: days of week messed up, should default to last 30 days

### Setup

- **Setup wizard**:
  - Make standalone setup wizard
    - Big screen after sign-up
    - Checkboxes for default items
    - Skip + start blank, or skip + start with all defaults
    - Flags that can edit anything anytime
    - What are best practices for setup wizards?
    - Remove accounts/categories from settings, only on the later setup page

### Add Transactions

- **Recent activity**: Ensure add transactions page has visible flag on what accounts need adding
- **Bulk transaction logic**: How should bulk transaction parse transactions? No regex, all LLM call? LLM call returns regex parsing? All regex
- **Transactions table**
  - Allow for table copy/paste (like when copying rows)
  - Auto expands when you reach bottom, and to get full paste

### History

- **Data export**: Download as csv
- **Sort/filter**: Easy sort and filter for transaction history

### Goals

### Settings

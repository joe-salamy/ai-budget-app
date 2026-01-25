**Next**: Dropdown menu hides scroll bar, continue convo and fix errors with that + fix build errors

### To do

- Read full repo
- Test all functionality
- Go through each page, test for UI; afterwards, do full CC sweep to ensure consistency

### General

- **Highlighting**: Want basically everything's border to highlight on hover, need to list out the things on each page
- **Data types**: Why don't all data types in index.ts have created at, updated at, deleted at?
- **Fix dropdowns**: Still transparent
- **Color**: Maybe add some color back, but make it very intentional
- **Privacy**: Best method for encryption / privacy for budget app? Want friends to feel more secure that I can’t just see all their transactions. Encrypted db?
- **Data loading**: Still takes a sec to load for add transactions, goals. Want all data reuqired for any page loaded when user gets to Dashboard.
- **Keyboard shortcuts**
  - Input transactions: tab next, enter down, control enter submit
  - Shortcut to get to each page
  - For every user action, make keyboard shortcut
- **Build errors**: In @ components

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
- **Diagrams**: Move both to top? They're cooler than the summaries
- **Date range selector**: days of week messed up, should default to last 30 days
  - Date range selector buttons: this month, this year, last 30 days, last 365 days, date range selector
  - Add last 3 months? Last 6 months? Input for "last x months"?
  - Could just see when users access the calendar, add that as input if enough ppl do it

### Setup

- **Setup wizard**:
  - Make standalone setup wizard
    - Big screen after sign-up
    - Checkboxes for default items
    - Skip + start blank, or skip + start with all defaults
    - Flags that can edit anything anytime
    - What are best practices for setup wizards?
    - Remove accounts/categories from settings, only on the later setup page
- **Inputs**: put max width, tables too wide

### Add Transactions

- **Recent activity**: Use stitch to optimize UI, where should it go?
  - Also, use stictch for the whole income expense transfer setup. What's optimal?
- **Recent activity**: Ensure add transactions page has visible flag on what accounts need adding
- **Bulk transaction logic**: How should bulk transaction parse transactions? No regex, all LLM call? LLM call returns regex parsing? All regex
- **Transactions table**
  - Allow for table copy/paste (like when copying rows)
  - Auto expands when you reach bottom, and to get full paste
- **Import statement**: Remove entirely, want that to be only through the AI
- **Amount input**: Don't like the tab up/down, just input amounts

### History

- **Data export**: Download as csv
- **Sort/filter**: Easy sort and filter for transaction history

### Goals

- **Testing**: ngl I don't even know what's going on

### Settings

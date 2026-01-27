### To do

- Read full repo
- Test all functionality
- Go through each page, test for UI; afterwards, do full CC sweep to ensure consistency
- Have Claude create summary of tech stack so I can use again, just want to get used to something
- Have it make plan to check every package, ensure using correct versioning. Don’t make any substantive changes, only correct package versions, if used incorrectly. If catch error, add comment explicitly stating what version to use.
  - "The issue was that your project uses react-day-picker v9, which changed the classNames API from v8. I updated src/components/ui/Calendar.tsx:31-42 with the correct v9 class names:"

### General

- **AI**: Test AI chatbox
- **Color**: Maybe add some color back, but make it very intentional
- **Privacy**: Best method for encryption / privacy for budget app? Want friends to feel more secure that I can’t just see all their transactions. Encrypted db?
- **Keyboard shortcuts**
  - Input transactions: tab next, enter down, control enter submit
  - Shortcut to get to each page
  - For every user action, make keyboard shortcut
- **Build errors**: In @ components
- Date range: can input dates, just as numbers
- Date selectors: modernize
- Make ALL inputs and mini-cards highlightable, like Setup --> Accounts, the account name inputs, each account down below.

### Navbar

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
- In settings, make selectable what fun icon you want your account to be. Give like 10,000 options

### Settings

### Dashboard

- **Calendar**: number dates look ugly, where to put cal
- **Tables**: cols still look weird
- **Sankey**: Fix colors, text overlaps, don't like the savings bar - just eliminate
  - Ensure that it only shows from start date to end date
- **Diagrams**: Move both to top? They're cooler than the summaries
  - Just a button to expand to full screen? Detailed view?
- **Date range selector**: days of week messed up, should default to last 30 days
  - Date range selector buttons: this month, this year, last 30 days, last 365 days, date range selector
  - Add last 3 months? Last 6 months? Input for "last x months"?
  - Could just see when users access the calendar, add that as input if enough ppl do it
  - Include an all-time button? Could be fun

### Setup

- **Setup wizard**:
  - Make standalone setup wizard
    - Big screen after sign-up
    - Checkboxes for default items
    - Skip + start blank, or skip + start with all defaults
    - Flags that can edit anything anytime
    - What are best practices for setup wizards?
    - Remove accounts/categories from settings, only on the later setup page
- Throughout app, only show categories, subcategories, accounts sorted alphabetically
- Move Goals to Subcategories + rename to bugdet, show tree of categories
- Add budget for each subcategory (including income), at bottom show the remaining balance
  - Input budget as %?
  - Eliminate the start and end dates from budget goals
- Account value goals? By certain date? Can count start and end date, calculate progress

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
- Make the edit sign match the ones used elsewhere in repo

### History

- **Data export**: Download as csv
- **Sort/filter**: Easy sort and filter for transaction history

### Goals

- **Testing**: Delete page, move to Setup + test goals features, how they work

### Settings

- Make Profile card narrower (1 row?)

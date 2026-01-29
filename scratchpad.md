### Prompt queue

Continue last one

Modify date selector/date range selector buttons to have larger clickable area for switch month
Change date selector/date range selector buttons to have gray
Make the bubble look better (shifted to left, make it smaller + centered)

---

Make the following changes to History page:

- Move the Clear Filters button to sit on top of the card, so that it doesn't shift everything down when it appears
- Change the Transaction History filter card to be more compact. Everythign should fit on 1 screen, on a standard laptop viewing width.
- Change the formatting of the Transaction History table to match the formatting of the Accounts table on the Setup page. (Header row should be gray, actions icons should match, etc)

### To do

- Sweep full frontend for consistency
- Create summary of tech stack so I can use again, just want to get used to something
- Check every package, ensure correct versioning. If catch error, add comment explicitly stating what version to use.
  - "The issue was that your project uses react-day-picker v9, which changed the classNames API from v8. I updated src/components/ui/Calendar.tsx:31-42 with the correct v9 class names:"

### General

- **Color**: Add color back, intentionally
- **Privacy**: Best method for encryption / privacy for budget app? Want friends to feel more secure that I can’t just see all their transactions. Encrypted db?
- **Keyboard shortcuts**
  - Input transactions: tab next, enter down, control enter submit
  - Shortcut to get to each page
  - For every user action, make keyboard shortcut
- **Build errors**: In @ components
- Date range: can input dates, switch to numbers
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
  - Fix loading, how come the others load first

### Setup

- **Setup wizard**:
  - Make standalone setup wizard
    - Big screen after sign-up
    - Checkboxes for default items
    - Skip + start blank, or skip + start with all defaults
    - Flags that can edit anything anytime
    - What are best practices for setup wizards?
    - Remove accounts/categories from settings, only on the later setup page
- Account value goals? By certain date? Can count start and end date, calculate progress

### Add Transactions

- **Recent activity**: Use stitch to optimize UI, where should it go?
  - Also, use stictch for the whole income expense transfer setup. What's optimal?
- **Recent activity**: Ensure add transactions page has visible flag on what accounts need adding
- **Bulk transaction logic**: How should bulk transaction parse transactions? No regex, all LLM call? LLM call returns regex parsing? All regex
  - Analyze regex. LLM should only do categorize.
  - Do cc statements show sign? Or just color?
  - Does Fidelity show transaction history? Only issue is transfer to Roth or brokerage, would need to add transaction

- **Transactions table**
  - Allow for table copy/paste (like when copying rows)
  - Auto expands when you reach bottom, and to get full paste
- **Import statement**: Remove entirely, want that to be only through the AI
- **Amount input**: Don't like the tab up/down, just input amounts
- Make the edit sign match the ones used elsewhere in repo
- Remove Category name from Subcategory dropdown

### History

- **Data export**: Download as csv
- **Sort/filter**: Easy sort and filter for transaction history
- Have table match before

### Goals

- **Testing**: Delete page, move to Setup + test goals features, how they work

### Settings

- Make Profile card narrower (1 row?)

### Checklist

Checklist:
◽️Privacy Policy
◽️Terms of Service
◽️Delete Account
◽️Restore Purchase
◽️App screenshots
◽️Marketing copy
◽️Support pages & FAQ
◽️Figuring out the deployment pipeline
◽️Testflight setup
◽️In-App Purchase documentation
◽️App Privacy declarations
◽️8 iterations on imprecise wording
◽️Age rating
◽️Regulations and Permits

### To do

- Fix supabase warnings

### Overall plan

- Create AI chatbot functionality
- Test backend (debug React with dev tools) (keep existing frontend around for testing)
- Refactor entire frontend using Stitch
  - Mandatory rules on rewrite: wherever possible, use default shadcn instead of creating my own components, and use default tailwind instead of creating custom css

### General

- **Tech stack**: Create summary of tech stack so I can use again, just want to get used to something
- **Package versioning**: Check every package, ensure correct versioning. If catch error, add comment explicitly stating what version to use.
  - "The issue was that your project uses react-day-picker v9, which changed the classNames API from v8. I updated src/components/ui/Calendar.tsx:31-42 with the correct v9 class names:"
  - Add comments next to imports emphasizing versionings
- **Privacy**: Best method for encryption / privacy for budget app? Want friends to feel more secure that I can’t just see all their transactions. Encrypted db?
- **Keyboard shortcuts**: Page nav, all users actions (after UI sweep)
- **Data loading**: Change the data loading to save data - going from last 365 days to last 90 days to last 30 days shouldn't be a new data queue. Just filter display the already-known data to only display last 30 days. Also, don't like the delay between loads - what causes that? Read the loading files

### AI

- **Categorize after startup**: Desired first user action is copy/paste transaction history into AI - how to get these all right, w/o user data? That's the wow moment.
- **Agent design**: Model? Langgraph? Logging? Handle multiple actions, task queue?
- **Bulk transaction logic**:
  1. Paste transactions
  2. AI identifies block, sends to function
  3. Regex parses to json
  4. Iterate for known transactions (filter to unique? Use most recent)
  5. Send unknown to LM
  6. Paste all transactions into Add Transactions, in original order
- Add system instructions (for this transaction, add this one [transfer to brokerage, roth])
- If agent consumes this already, bother with regex function + search existing transactions? LLM already consuming the tokens
  - Describe the agent dilemma to Gemini/Claude, see best solution

### Settings

- **Icons**: Make selectable what fun icon you want your account to be. Give like 10,000 options

### Dashboard

- **Sankey**: Fix colors, text overlaps, don't like savings bar (delete)
  - Ensure shows only from start date to end date
- **Diagrams**: Add button to expand to full screen? Detailed view?

### Setup

- **Setup wizard**: Big screen after sign-up, checkboxes for default items
  - Skip + start blank, or skip + start with all defaults
  - Flags that can edit anything anytime

### Add Transactions

- Warning for leaving page? Save un-sent transactions to local data so can change pages?

### History

- **Data export**: Download as csv
- **Running balance**: Doesn't calculate properly, annoying
- **Initial balance**: Treat just like any other transaction, this is retarded+

### Checklist

- Privacy Policy
- Terms of Service
- Delete Account
- Restore Purchase
- Support pages & FAQ
- Testflight setup
- Age rating

### Maybe later

- Account value goals? By certain date? Can count start and end date, calculate progress

### What I learned

- Designing UI/UX yourself is useless - just design around functionality, and have Stich/AI design UI
- Read the logic, AI is retarded
- Ton of UI/UX fixes are just the z-value - AI is fucking retarded
- Opted for simplicity: remove transaction type (income/expense, users just input sign properly), transfers (AI adding it all anyway, might as well simplify), initial balance (just another transaction)

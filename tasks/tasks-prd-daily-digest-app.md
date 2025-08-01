## Relevant Files

- `App.tsx` - Main entry point for the React Native app.
- `navigation/` - Contains navigation setup (TabNavigator, StackNavigators for Home, Saved, Feeds, Settings).
- `screens/OnboardingScreen.tsx` - User onboarding and template pack selection.
- `screens/SignInScreen.tsx` - User authentication UI.
- `screens/DigestScreen.tsx` - Displays the daily digest.
- `screens/FeedManagementScreen.tsx` - Manage user feeds and template packs.
- `screens/SavedArticlesScreen.tsx` - View and manage saved articles.
- `screens/SettingsScreen.tsx` - User preferences (notification time, display mode, etc.).
- `components/ContentItem.tsx` - UI component for displaying a content item.
- `components/TemplatePackSelector.tsx` - UI for selecting template packs.
- `lib/supabase.ts` - Supabase client and API helpers.
- `lib/ai.ts` - AI integration for content ranking and summarization.
- `lib/notifications.ts` - Push notification scheduling and delivery.
- `lib/contentFetchers/` - Edge functions or scripts for fetching RSS, Reddit, YouTube, X/Twitter content.
- `lib/utils/timezone.ts` - Timezone conversion utilities.
- `lib/utils/helpers.ts` - General utility functions.
- `__tests__/` - Directory for unit and integration tests for all major modules/components.
- `.env` - Environment variables for Supabase URL and anon key.
- `.git/` - Git repository for version control.

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `MyComponent.tsx` and `MyComponent.test.tsx` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.

## Tasks

- [x] 1.0 Project Setup & Core Infrastructure
  - [x] 1.1 Initialize Expo React Native project with TypeScript.
  - [x] 1.2 Set up Supabase project and configure database schema (users, feeds, content, digests, etc.).
  - [x] 1.3 Install and configure core dependencies (navigation, notifications, Supabase, etc.).
  - [x] 1.4 Set up environment variables and configuration files.
  - [x] 1.5 Set up version control and basic CI/CD pipeline.

- [x] 2.0 User Authentication & Account Management
  - [x] 2.1 Implement sign up, sign in, and sign out flows using Supabase Auth.
  - [x] 2.2 Create onboarding flow for new users (template pack selection, timezone, notification time).
  - [x] 2.3 Implement user profile management (update email, password, preferences).
  - [x] 2.4 Store and retrieve user preferences (feeds, display mode, notification time).

- [x] 3.0 Feed Source Integration & Management
  - [x] 3.1 Implement UI for adding/removing RSS feeds, YouTube channels, Reddit subreddits, X/Twitter accounts.
  - [x] 3.2 Build template pack system for quick feed setup.
  - [x] 3.3 Store user feed selections in the database.
  - [x] 3.4 Implement backend/edge functions for fetching content from each source (RSS, YouTube, Reddit, X/Twitter).
  - [x] 3.5 Schedule regular content fetching jobs (Supabase Edge Functions/Cron).

- [ ] 4.0 Daily Digest Generation & Content Aggregation
  - [x] 4.1 Aggregate new content from all user feeds daily.
  - [x] 4.2 Use AI (OpenAI GPT-4) to rank and summarize content for each user.
  - [x] 4.3 Store generated daily digests in the database.
  - [x] 4.4 Implement logic to avoid duplicate content and handle errors from sources.

- [ ] 5.0 User Interface & Experience (UI/UX)
  - [x] 5.1 Implement minimalist UI as per `minimal-digest-design_sample.tsx` (light/dark mode, text-first, clean navigation).
  - [x] 5.2 Build DigestScreen to display daily content (news, Reddit, YouTube, X/Twitter sections).
  - [x] 5.3 Build FeedManagementScreen for managing sources and template packs.
  - [x] 5.4 Build SavedArticlesScreen for saved/read-later content.
  - [x] 5.5 Build SettingsScreen for user preferences.
  - [x] 5.6 Implement display mode toggle (minimal/text-only vs. rich/images).
  - [x] 5.7 Add loading, error, and empty states for all screens.

- [x] 6.0 Push Notifications & Reminders
  - [x] 6.1 Integrate Expo Push Notifications.
  - [x] 6.2 Allow users to set preferred notification time and timezone.
  - [x] 6.3 Schedule and send daily digest notifications at user’s chosen time.
  - [x] 6.4 Implement smart reminders for saved/read-later articles.
  - [x] 6.5 Handle notification permissions and edge cases.

- [x] 7.0 Save, Share, and Read Later Functionality
  - [x] 7.1 Implement save/read-later feature for content items.
  - [x] 7.2 Build reminders for unread saved articles.
  - [x] 7.3 Implement sharing functionality for content items.
  - [x] 7.4 Track and display saved/read articles in the UI.

- [ ] 8.0 Testing, Analytics, and Success Metrics
  - [ ] 8.1 Write unit and integration tests for all major modules/components.
  - [ ] 8.2 Set up analytics tracking (user engagement, open rates, etc.).
  - [ ] 8.3 Monitor push notification delivery and open rates.
  - [ ] 8.4 Collect and display user feedback on minimalism and focus.
  - [ ] 8.5 Conduct manual and automated testing for all flows. 
# Product Requirements Document (PRD): mybrief

## 1. Introduction/Overview

mybrief is a mobile application designed to help busy professionals, startup founders, and tech enthusiasts stay informed without being overwhelmed by the multitude of information sources (YouTube, newsletters, X/Twitter, Reddit, RSS, etc.). The app curates content from these sources and delivers a minimal, distraction-free, snackable daily digest. Users can customize their feeds, save articles for later, and receive push notifications at their preferred time, all within a super-minimalist interface (see `minimal-digest-design_sample.tsx`).

## 2. Goals

- Aggregate and curate content from multiple sources (RSS, YouTube, Reddit, X/Twitter) into a single daily digest in mybrief.
- Provide a minimal, distraction-free reading experience.
- Allow users to customize their feed sources and use template packs for quick setup.
- Enable users to save articles for later and receive reminders.
- Deliver daily push notifications at user-specified times, respecting user timezones.
- Support sharing of content from the app.

## 3. User Stories

- As a user, I want to quickly set up my own custom feed by adding YouTube channels, subreddits, X accounts, and RSS feeds, so I can see all my favorite content in one place in mybrief.
- As a user, I want to use template packs (e.g., Technology, Entrepreneur) to get started quickly with curated sources.
- As a user, I want to receive a daily push notification at my chosen time, so I can read my digest when it suits me.
- As a user, I want to save interesting articles for later and get reminders to read them.
- As a user, I want to share content from my digest with others.
- As a user, I want a minimal, text-focused interface by default, with the option to enable images.

## 4. Functional Requirements

1. The system must allow users to sign up, log in, and manage their account in mybrief.
2. The system must allow users to add/remove feed sources: RSS, YouTube channels, Reddit subreddits, X/Twitter accounts.
3. The system must provide template packs of pre-curated feeds for quick setup.
4. The system must fetch and aggregate new content from all user feeds daily.
5. The system must generate a daily digest, ranking and summarizing content using AI.
6. The system must allow users to save articles/content for later reading.
7. The system must allow users to share articles/content externally.
8. The system must allow users to set their preferred notification time and timezone.
9. The system must send a daily push notification with the new digest at the user’s chosen time.
10. The system must provide reminders for saved articles not yet read.
11. The system must allow users to choose between minimal (text-only) and rich (with images) display modes.
12. The system must provide a minimal, distraction-free UI as per the design sample.
13. The system must allow users to manage (add/remove) their feed sources and template packs after onboarding.

## 5. Non-Goals (Out of Scope)

- Podcast and newsletter ingestion via unique user email (can be considered for future versions).
- Social features such as following other users or in-app comments.
- Advanced AI features (e.g., YouTube video summarization) for MVP.
- Android support for initial launch (unless otherwise specified).
- In-app purchases or subscription management (unless specified).

## 6. Design Considerations

- Follow the minimalist, ADHD-friendly design as shown in `minimal-digest-design_sample.tsx`.
- Use clear, readable typography and high-contrast themes (light/dark mode toggle).
- Prioritize text content, with optional image support.
- Simple navigation: Home (Digest), Saved, Feeds, Settings.
- Use template packs for onboarding and feed management.

## 7. Technical Considerations

- Use React Native with Expo for cross-platform development.
- Use Supabase for backend (auth, database, edge functions, push notifications).
- Use OpenAI GPT-4 for content ranking and summarization.
- Schedule content fetching and notification delivery using Supabase Edge Functions and Cron.
- Store user preferences (feeds, notification time, display mode) in Supabase.
- Ensure timezone-aware scheduling for notifications.
- Use Expo Push Notifications for reliable delivery.

## 8. Success Metrics

- Daily active users (DAU) and retention rates.
- Digest open rates and average time spent in app.
- Number of articles saved and read later.
- User engagement with template packs and custom feeds.
- Push notification delivery and open rates.
- User feedback on minimalism and focus.

## 9. Open Questions

- Should Android support be included in the MVP, or is iOS-only sufficient for launch?
- Should there be any limits on the number of feeds a user can add?
- What is the minimum set of template packs to include at launch?
- Should users be able to import OPML files for bulk RSS feed import?
- Any specific analytics or privacy requirements?
- Should there be onboarding tips or a tutorial for first-time users? 
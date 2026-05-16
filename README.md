# NotifyMe

NotifyMe is a natural-language-driven notification system that monitors the web, schedules, and APIs based on plain English user requests, dynamically asking clarifying questions when needed.

## 🚀 Planned Features
- **Natural Language Intent:** Turn phrases like "Notify me when GTA 6 comes out" into automated monitors.
- **Dynamic Context Gathering:** Automatically asks 0 to N follow-up questions to fill in missing parameters (e.g., location, dates).
- **Agentic Evaluation:** Uses background cron jobs paired with LLMs and web agents to evaluate real-time conditions.
- **Rich Alerts:** Delivers custom SMS text messages accompanied by context-specific GIFs.

## 📋 Capabilities & Limitations

### Supported
- **Static/Dynamic Calendars:** Mom's birthday (asks DOB, runs annually), Mother's Day (calculates shifting dates).
- **Social Media Polling:** Trump tweets (checks every 30 mins via Twitter API/Web Runner).
- **Environmental Alerts:** Rain notifications (asks for user location, checks hourly weather APIs).
- **Public Web Tracking:** Yankees wins, Nike sales, GTA 6 release, Google internships (uses Tavily Web Agent).
- **Ephemeral Events:** License renewal deadlines, airplane landing tracking.

### Unsupported Examples (Out of Scope)
- **Authenticated / Anti-Bot Scrapes:** Package tracking (carrier sites employ aggressive anti-scraping).
- **Private Social Graphs:** Instagram follower tracking (requires authenticated API access prone to breaking).

## 🧰 Tech Stack
- **NLP & Orchestration:** Generic LLM for intent parsing and follow-up generation.
- **Web Research Agent:** [Tavily AI Playground](https://app.tavily.com/playground) for executing real-time web verification.
- **Execution:** Scheduled Cron Workers for background task evaluation.
- **Delivery:** SMS Gateway supporting MMS payloads for GIF rendering.
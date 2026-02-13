
# Product Requirements Document

# VoiceDraft
### Voice → Blog in One Tap

**Mobile-First Voice-to-SEO Blog Application**

---

**Version:** 1.0 | February 2026
**Product Lead:** Vignesh
**Platform:** iOS & Android (Mobile-First)

---

## Document Information

| Field | Details |
|-------|---------|
| Product Name | VoiceDraft |
| Version | 1.0 (MVP) |
| Target Platforms | iOS, Android (React Native or Flutter) |
| Backend | Serverless (Vercel/AWS Lambda) |
| AI Services | OpenAI Whisper (transcription), GPT-4 (expansion) |
| Timeline | 6-8 weeks MVP |

---

## 1. Executive Summary

VoiceDraft is a mobile-first application that transforms quick voice recordings into publish-ready, SEO-optimized blog posts. Users record 2-5 minutes of audio, and VoiceDraft handles transcription, expansion, structuring, and SEO optimization—delivering a 1000-1500 word blog post ready for publishing.

**The Core Promise**: Ramble for 5 minutes → Get a publish-ready SEO blog post.

**Market Gap**: AudioPen ($29, $15K/mo revenue) validates voice-to-text demand. Outrank ($99/mo) validates AI SEO blog demand. No one combines both in a mobile-first package.

---

## 2. Problem Statement

### 2.1 The Content Creator's Dilemma

- **Ideas are abundant, execution is hard**: Creators have valuable thoughts but struggle to write
- **SEO is tedious**: Keyword research, headers, meta descriptions—feels like homework
- **Writing takes time**: A 1500-word blog post takes 3-5 hours for most people
- **Mobile is underserved**: Most content tools are desktop-first

### 2.2 Why Existing Solutions Fail

| Solution Type | Why It Fails | VoiceDraft Difference |
|---------------|--------------|----------------------|
| AudioPen/Voicenotes | Transcribe only, no SEO structure | Full blog output with SEO |
| Outrank/Surfer | Text input required, desktop-focused | Voice input, mobile-first |
| Castmagic | Designed for podcasts (long-form) | Optimized for quick captures |
| ChatGPT/Claude | Requires careful prompting | One-tap, pre-optimized workflow |

---

## 3. Target Users

### 3.1 Primary Personas

#### Persona 1: The Indie Hacker (Raj)

- **Demographics:** 32-year-old solo founder
- **Behavior:** Building a SaaS product, knows content marketing matters
- **Pain Point:** Has expertise to share but writing takes too long
- **Use Case:** Record product updates, feature explanations on morning walks
- **Quote:** "I can talk about my product for hours. Writing about it? Torture."

#### Persona 2: The Coach/Consultant (Maya)

- **Demographics:** 45-year-old business coach
- **Behavior:** Constantly sharing advice with clients
- **Pain Point:** Repeats same advice but never turns it into content
- **Use Case:** Record client advice sessions, turn into thought leadership content
- **Quote:** "I just told a client exactly what they needed. Why can't that be a blog post?"

#### Persona 3: The Side-Hustle Blogger (Alex)

- **Demographics:** 28-year-old with a full-time job and a blog
- **Behavior:** Wants to grow blog traffic but has limited time
- **Pain Point:** Can only write on weekends, wants to publish more
- **Use Case:** Record ideas during commute, publish polished posts
- **Quote:** "I have 45 minutes on the train. That should be enough for a blog post."

---

## 4. User Stories & Acceptance Criteria

### 4.1 Core User Stories

| ID  | User Story                                                                              | Acceptance Criteria                                                                       |
| --- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| US1 | As a user, I want to record audio with one tap so I can capture ideas instantly         | App opens to record screen, single tap starts recording, visual feedback during recording |
| US2 | As a user, I want my recording transcribed accurately so I don't lose my thoughts       | Whisper transcription with >95% accuracy, processing in <30 seconds for 5-min audio       |
| US3 | As a user, I want my rambling expanded into a structured blog so I save time            | Output includes title, meta description, H2 headers, 1000-1500 word body                  |
| US4 | As a user, I want to input a target keyword so my post ranks on Google                  | Keyword integrated naturally into title, meta, headers, and body                          |
| US5 | As a user, I want to review and edit the generated post so I maintain my voice          | Full-text editor with markdown support, regenerate sections option                        |
| US6 | As a user, I want to export/copy the final post so I can publish anywhere               | Copy as Markdown, Copy as HTML, Export to Notion/WordPress (future)                       |
| US7 | As a user, I want to see my previous drafts so I can revisit ideas                      | Draft history with search, sorted by date                                                 |
| US8 | As a user, I want the app to work offline for recording so I can capture ideas anywhere | Offline recording, sync when connected                                                    |

---

## 5. Feature Specifications

### 5.1 Core Features (MVP)

#### Feature 1: One-Tap Recording

**Description:** Instant audio capture optimized for mobile

**Requirements:**
- App opens directly to record screen
- Large, prominent record button
- Visual waveform during recording
- Background recording support (screen off)
- Maximum recording length: 10 minutes (MVP)
- Audio format: AAC or M4A (efficient compression)

**UI Behavior:**
```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│      ~~~~~ WAVEFORM ~~~~~           │
│                                     │
│           [03:24]                   │
│                                     │
│                                     │
│              ⬤                     │
│          (RECORDING)                │
│                                     │
│     [Pause]      [Stop & Process]   │
│                                     │
└─────────────────────────────────────┘
```

---

#### Feature 2: AI Transcription (Whisper)

**Description:** High-accuracy speech-to-text conversion

**Requirements:**
- OpenAI Whisper API integration
- Support for English (MVP), expand languages later
- Handle accents, filler words, pauses
- Processing time: <30 seconds for 5-minute audio
- Show processing progress indicator

**Technical Notes:**
- Use Whisper `whisper-1` model
- Send audio in chunks for long recordings
- Cache transcription for regeneration

---

#### Feature 3: Blog Expansion Engine (GPT-4)

**Description:** Transform raw transcript into structured SEO blog

**Input:**
- Transcription text
- Target keyword (optional)
- Blog length preference (Short: 800w, Medium: 1200w, Long: 1500w)
- Tone preference (Professional, Casual, Conversational)

**Output Structure:**
```
Title: [SEO-optimized, includes keyword, <60 chars]

Meta Description: [Compelling summary, includes keyword, 150-160 chars]

---

# [H1 Title]

[Engaging introduction paragraph - hook the reader]

## [H2 Section 1]
[2-3 paragraphs expanding on first key point]

## [H2 Section 2]
[2-3 paragraphs expanding on second key point]

## [H2 Section 3]
[2-3 paragraphs expanding on third key point]

## Key Takeaways
- [Bullet point 1]
- [Bullet point 2]
- [Bullet point 3]

[Conclusion paragraph with call-to-action]
```

**Prompt Engineering Principles:**
1. Preserve user's voice and key phrases
2. Never invent facts or statistics
3. Add structure and flow, not fluff
4. Natural keyword integration (not stuffing)
5. Actionable, specific content over generic advice

---

#### Feature 4: Keyword Input

**Description:** Target keyword for SEO optimization

**Requirements:**
- Optional text field before processing
- Keyword suggestions based on transcript (nice-to-have)
- Keyword placement report in output

**Keyword Integration:**
- In title (preferably at start)
- In meta description
- In at least one H2
- Naturally in first paragraph
- 2-3 times in body (natural density)

---

#### Feature 5: Post Editor

**Description:** Review and refine generated content

**Requirements:**
- Full markdown editor
- Preview rendered HTML
- Regenerate specific sections
- Undo/redo support
- Word count display
- Auto-save drafts

**Editor Actions:**
- Edit text directly
- "Regenerate this section" button per H2
- "Make shorter" / "Make longer" options
- "Change tone" option

---

#### Feature 6: Export Options

**Description:** Get content out of the app

**MVP Exports:**
- Copy as Markdown
- Copy as HTML
- Copy as Plain Text
- Share via system share sheet

**Future Exports:**
- Direct publish to WordPress
- Export to Notion
- Export to Ghost
- Email to self

---

#### Feature 7: Draft Library

**Description:** Access previous recordings and generated posts

**Requirements:**
- List view of all drafts
- Sort by date (newest first)
- Search by title/content
- Delete drafts
- Favorite/star important drafts

**Draft States:**
- Recording (audio saved, not processed)
- Processing (in AI pipeline)
- Draft (generated, not exported)
- Published (marked as exported)

---

### 5.2 Nice-to-Have Features (Post-MVP)

| Feature | Description | Priority |
|---------|-------------|----------|
| Brand Voice Training | Upload 3-5 existing posts, AI matches style | High |
| WordPress Integration | One-click publish to WordPress sites | High |
| Multi-language | Support for Hindi, Spanish, French, etc. | Medium |
| Audio Enhancement | Noise reduction, normalization pre-processing | Medium |
| Keyword Suggestions | AI suggests keywords based on transcript | Medium |
| Content Calendar | Schedule posts for future dates | Low |
| Team Features | Share drafts, collaborate | Low |
| Analytics | Track published post performance | Low |

---

## 6. Technical Architecture

### 6.1 System Overview

```
┌────────────────────────────────────────────────────────────┐
│                     MOBILE APP                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Record    │  │    Edit     │  │   Library   │         │
│  │   Screen    │  │   Screen    │  │   Screen    │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
│         │                │                │                │
│         └────────────────┼────────────────┘                │
│                          │                                 │
│  ┌───────────────────────┴───────────────────────┐         │
│  │              Local Storage (SQLite)           │         │
│  │         (Drafts, Settings, Audio Cache)       │         │
│  └───────────────────────┬───────────────────────┘         │
└──────────────────────────┼─────────────────────────────────┘
                           │
                    API Calls (HTTPS)
                           │
┌──────────────────────────┼─────────────────────────────────┐
│                     BACKEND (Serverless)                   │
│                          │                                 │
│  ┌───────────────────────┴───────────────────────┐         │
│  │              API Gateway (Vercel/AWS)         │         │
│  └───────────────────────┬───────────────────────┘         │
│                          │                                 │
│         ┌────────────────┼────────────────┐                │
│         │                │                │                │
│  ┌──────┴──────┐  ┌──────┴──────┐  ┌──────┴──────┐         │
│  │  Whisper    │  │   GPT-4     │  │   Auth      │         │
│  │  Endpoint   │  │  Endpoint   │  │  Service    │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
│         │                │                │                │
│         ▼                ▼                ▼                │
│  ┌─────────────────────────────────────────────────┐       │
│  │            OpenAI API / Anthropic API           │       │
│  └─────────────────────────────────────────────────┘       │
│                                                            │
│  ┌─────────────────────────────────────────────────┐       │
│  │            Database (Supabase/Postgres)         │       │
│  │         (User accounts, usage tracking)         │       │
│  └─────────────────────────────────────────────────┘       │
└────────────────────────────────────────────────────────────┘
```

### 6.2 Tech Stack

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Mobile Framework | React Native or Flutter | Cross-platform, fast development |
| State Management | Zustand (RN) or Riverpod (Flutter) | Lightweight, efficient |
| Local Database | SQLite | Offline-first, reliable |
| Audio Recording | Expo AV (RN) or just_audio (Flutter) | Native quality |
| Backend | Vercel Edge Functions or AWS Lambda | Serverless, scalable |
| Transcription | OpenAI Whisper API | Best accuracy, reasonable cost |
| LLM | OpenAI GPT-4 or Claude 3 | Quality output |
| Auth | Supabase Auth or Firebase Auth | Simple, handles OAuth |
| Database | Supabase (Postgres) | Real-time, generous free tier |
| Payments | RevenueCat | Cross-platform subscriptions |

### 6.3 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/transcribe` | POST | Upload audio, return transcription |
| `/api/generate` | POST | Send transcript + options, return blog |
| `/api/regenerate-section` | POST | Regenerate specific section |
| `/api/user/drafts` | GET | List user's drafts |
| `/api/user/usage` | GET | Check remaining credits |

---

## 7. Data Model

### 7.1 Core Entities

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  plan: 'free' | 'pro' | 'team';
  postsRemaining: number;       // Resets monthly
  createdAt: Date;
  settings: UserSettings;
}

interface UserSettings {
  defaultTone: 'professional' | 'casual' | 'conversational';
  defaultLength: 'short' | 'medium' | 'long';
  notificationsEnabled: boolean;
}

interface Draft {
  id: string;
  userId: string;
  status: 'recording' | 'transcribing' | 'generating' | 'ready' | 'published';

  // Audio
  audioUrl?: string;           // Local or cloud URL
  audioDuration?: number;      // Seconds

  // Transcription
  transcript?: string;

  // Generation Input
  targetKeyword?: string;
  tone: string;
  length: string;

  // Output
  title?: string;
  metaDescription?: string;
  content?: string;            // Markdown
  wordCount?: number;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

interface UsageLog {
  id: string;
  userId: string;
  action: 'transcribe' | 'generate' | 'regenerate';
  tokensUsed: number;
  cost: number;
  timestamp: Date;
}
```

---

## 8. UI/UX Design

### 8.1 Design Principles

1. **One-Tap to Record**: Minimize friction to capture ideas
2. **Progressive Disclosure**: Show complexity only when needed
3. **Instant Feedback**: Always show progress, never leave user waiting
4. **Offline-Capable**: Core recording works without internet
5. **Thumb-Friendly**: All key actions reachable with one hand

### 8.2 Key Screens

#### Screen 1: Home / Record

```
┌─────────────────────────────────────┐
│  VoiceDraft              [Profile]  │
├─────────────────────────────────────┤
│                                     │
│                                     │
│     Record your next blog post      │
│                                     │
│                                     │
│              ┌─────┐                │
│              │     │                │
│              │  ⬤ │  ← Tap to      │
│              │     │    Record      │
│              └─────┘                │
│                                     │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ Recent Drafts                 │  │
│  │                               │  │
│  │ ├ "How to validate..."  2h    │  │
│  │ ├ "Why we pivoted..."   1d    │  │
│  │ └ "Building in pub..."  3d    │  │
│  └───────────────────────────────┘  │
│                                     │
│  [Record]    [Drafts]    [Settings] │
└─────────────────────────────────────┘
```

#### Screen 2: Recording

```
┌─────────────────────────────────────┐
│  [Cancel]              Recording... │
├─────────────────────────────────────┤
│                                     │
│                                     │
│         ██▄  ▄██  ▄█▄  ██▄          │
│         Waveform visualization      │
│                                     │
│                                     │
│              [04:32]                │
│                                     │
│     Tip: Speak naturally, we'll     │
│     handle the structure            │
│                                     │
│                                     │
│              ┌─────┐                │
│              │  ⏸  │                │
│              └─────┘                │
│            [Pause]                  │
│                                     │
│     ┌─────────────────────────┐     │
│     │    Done - Process Now   │     │
│     └─────────────────────────┘     │
│                                     │
└─────────────────────────────────────┘
```

#### Screen 3: Processing

```
┌─────────────────────────────────────┐
│  [Cancel]            Processing...  │
├─────────────────────────────────────┤
│                                     │
│                                     │
│        Creating your blog post      │
│                                     │
│     ┌───────────────────────────┐   │
│     │ ✓ Audio uploaded          │   │
│     │ ✓ Transcription complete  │   │
│     │ ◐ Generating blog...      │   │
│     │ ○ Optimizing for SEO      │   │
│     └───────────────────────────┘   │
│                                     │
│                                     │
│     ┌───────────────────────────┐   │
│     │ Target Keyword (optional) │   │
│     │ [    productivity tips   ]│   │
│     └───────────────────────────┘   │
│                                     │
│     Length: ● Short ○ Medium ○ Long │
│                                     │
│     Tone: ○ Pro ● Casual ○ Conv     │
│                                     │
└─────────────────────────────────────┘
```

#### Screen 4: Editor

```
┌─────────────────────────────────────┐
│  [Back]    Edit Post      [Export]  │
├─────────────────────────────────────┤
│  Title:                             │
│  ┌───────────────────────────────┐  │
│  │ 10 Productivity Tips That...  │  │
│  └───────────────────────────────┘  │
│                                     │
│  Meta Description:                  │
│  ┌───────────────────────────────┐  │
│  │ Discover practical tips to... │  │
│  └───────────────────────────────┘  │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  # 10 Productivity Tips That        │
│  Actually Work                      │
│                                     │
│  If you're like me, you've tried    │
│  every productivity hack under...   │
│                                     │
│  ## 1. Start With Your Hardest      │
│  Task                     [Regen]   │
│                                     │
│  The morning is when your brain...  │
│                                     │
│  ─────────────────────────────────  │
│  1,247 words    │ Preview │ Markdown│
└─────────────────────────────────────┘
```

---

## 9. Monetization

### 9.1 Pricing Tiers

| Tier | Price | Posts/Month | Features |
|------|-------|-------------|----------|
| **Free** | $0 | 3 | Basic SEO, standard tones, Markdown export |
| **Pro** | $19/mo | 30 | Advanced SEO, brand voice, all exports, priority processing |
| **Team** | $49/mo | Unlimited | Everything in Pro + team collaboration, custom prompts |

### 9.2 Cost Analysis (Per Post)

| Step | API | Cost |
|------|-----|------|
| Transcription (5 min audio) | Whisper | ~$0.03 |
| Blog Generation (~1500 tokens) | GPT-4 | ~$0.06 |
| Regenerations (avg 1 per post) | GPT-4 | ~$0.03 |
| **Total per post** | | **~$0.12** |

**Unit Economics:**
- Free tier: 3 posts × $0.12 = $0.36/user/month (CAC investment)
- Pro tier: 30 posts × $0.12 = $3.60 cost → $19 revenue = **$15.40 margin**
- Gross margin: ~80%

---

## 10. MVP Scope & Timeline

### 10.1 MVP Features (Must Have)

- [x] One-tap audio recording
- [x] Whisper transcription
- [x] GPT-4 blog generation with SEO
- [x] Basic keyword input
- [x] Markdown/HTML export
- [x] Draft library
- [x] User authentication
- [x] Free tier (3 posts/month)

### 10.2 Development Timeline (8 Weeks)

| Week | Focus | Deliverables |
|------|-------|--------------|
| **Week 1-2** | Core Mobile | Recording, audio upload, basic UI shell |
| **Week 3** | Backend & AI | Whisper integration, GPT-4 prompting |
| **Week 4** | Blog Engine | Output formatting, SEO optimization, editor |
| **Week 5** | Polish | Draft library, export options, error handling |
| **Week 6** | Auth & Payments | User accounts, subscription setup |
| **Week 7** | Testing | Bug fixes, performance optimization, beta testing |
| **Week 8** | Launch Prep | App store submission, landing page, docs |

---

## 11. Success Metrics

### 11.1 North Star Metric

**Monthly Active Creators (MAC)**: Users who generate at least 1 blog post per month

### 11.2 Key Metrics

| Metric                  | Target (Month 1) | Target (Month 6) |
| ----------------------- | ---------------- | ---------------- |
| Downloads               | 1,000            | 10,000           |
| Monthly Active Creators | 200              | 2,000            |
| Free → Pro Conversion   | 5%               | 10%              |
| Posts Generated         | 500              | 10,000           |
| App Store Rating        | 4.0+             | 4.5+             |
| Churn Rate (Pro)        | <10%/mo          | <5%/mo           |

### 11.3 Quality Metrics

| Metric | Target |
|--------|--------|
| Transcription Accuracy | >95% |
| Processing Time (5 min audio) | <60 seconds |
| Blog Quality Score (user rating) | 4.0/5.0 |
| Export Rate (posts exported) | >60% |

---

## 12. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| OpenAI API costs spike | Medium | High | Monitor usage, implement rate limiting, consider Claude as backup |
| Blog quality inconsistent | Medium | High | Extensive prompt engineering, A/B testing, user feedback loop |
| App store rejection | Low | High | Follow guidelines, prepare for review, have web fallback |
| Competition launches similar | Medium | Medium | Move fast, focus on UX, build community |
| Users export and churn | Medium | Low | Add value with brand voice, integrations, calendar |

---

## 13. Go-to-Market Strategy

### 13.1 Launch Channels

1. **Product Hunt**: Launch on Product Hunt with demo video
2. **Indie Hackers**: Build in public, share progress
3. **Twitter/X**: Target content creators, indie makers
4. **YouTube**: "How I write blogs in 5 minutes" content
5. **SEO**: Target "voice to blog", "AudioPen alternative" keywords

### 13.2 Positioning

**Tagline Options:**
- "Ramble → Blog. Done."
- "Your voice, SEO-ready blogs."
- "Record 5 minutes. Publish a blog post."
- "The fastest way from idea to published post."

### 13.3 Launch Checklist

- [ ] Landing page with waitlist
- [ ] Demo video (60 seconds)
- [ ] App store screenshots and description
- [ ] Product Hunt ship page
- [ ] Press kit with founder story
- [ ] 10 beta testers with testimonials

---

## 14. Appendix

### 14.1 Sample GPT-4 Prompt

```
SYSTEM:
You are a professional blog writer and SEO specialist. Transform the
user's spoken transcript into a well-structured, SEO-optimized blog post.

RULES:
1. Preserve the user's voice, key phrases, and authentic examples
2. NEVER invent facts, statistics, or claims not in the transcript
3. Structure with clear H2 headers (3-5 sections)
4. Write engaging introduction that hooks the reader
5. Include actionable takeaways at the end
6. Target word count: {length}
7. Integrate keyword naturally: "{keyword}" (if provided)
8. Tone: {tone}

OUTPUT FORMAT:
Return a JSON object:
{
  "title": "SEO-optimized title under 60 chars",
  "metaDescription": "Compelling meta description, 150-160 chars",
  "content": "Full blog post in Markdown format"
}

USER TRANSCRIPT:
{transcript}
```

### 14.2 Competitive Positioning Matrix

```
                    Voice Input
                         │
              ┌──────────┴──────────┐
              │                     │
         Transcription         Full Blog
         Only                  Output
              │                     │
    ┌─────────┴─────────┐    ┌─────┴─────┐
    │                   │    │           │
 AudioPen          Voicenotes    VoiceDraft
 Letterly          (partial)    ← ONLY ONE
 TalkNotes                        WITH SEO
                                  + MOBILE
```

### 14.3 User Interview Questions

1. How often do you publish blog content?
2. What's your current writing workflow?
3. Have you tried voice-to-text tools? Which ones?
4. What's your biggest frustration with content creation?
5. How important is SEO to you?
6. Would you pay $19/month for 30 blog posts from voice notes?
7. Do you primarily use mobile or desktop for content work?

---

## 15. Approval & Sign-off

| Role | Name | Date |
|------|------|------|
| Product Lead | Vignesh | ___________ |
| Technical Review | ___________ | ___________ |
| Design Review | ___________ | ___________ |

---

*Document Version: 1.0*
*Created: February 2026*
*Last Updated: February 3, 2026*

---

**End of Document**

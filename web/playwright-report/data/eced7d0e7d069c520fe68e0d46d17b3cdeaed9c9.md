# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - link "Skip to main content" [ref=e2] [cursor=pointer]:
    - /url: "#main"
  - navigation "Main navigation" [ref=e3]:
    - generic [ref=e5]:
      - link "VoiceDraft Speak. Create." [ref=e6] [cursor=pointer]:
        - /url: /
        - img [ref=e8]
        - generic [ref=e11]:
          - generic [ref=e12]: VoiceDraft
          - generic [ref=e13]: Speak. Create.
      - generic [ref=e14]:
        - link "Explore" [ref=e15] [cursor=pointer]:
          - /url: /#featured-blogs
        - link "Get Started" [ref=e16] [cursor=pointer]:
          - /url: /api/auth/signin
        - button "Toggle theme" [ref=e17]:
          - img [ref=e18]
  - main [ref=e20]:
    - paragraph [ref=e24]: Loading draft...
  - region "Notifications"
  - alert [ref=e25]
```
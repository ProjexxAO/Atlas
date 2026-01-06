# Temple OS Documentation

Welcome to the Temple OS documentation. This guide will help you navigate all available docs.

---

## 📚 DOCUMENTATION INDEX

### Getting Started

| Document | Time | Purpose |
|----------|------|---------|
| [Main README](../README.md) | 5 min | Project overview, quick start, features |
| [Architecture](architecture.md) | 20 min | Complete system design and data flow |
| [Deployment](deployment.md) | 30 min | Production deployment walkthrough |

### Integration Guides

| Document | Time | Purpose |
|----------|------|---------|
| [Lovable Integration](lovable-integration.md) | 15 min | Frontend integration with code examples |
| [ElevenLabs Integration](elevenlabs-integration.md) | 15 min | Voice capabilities setup |

### Planning Templates (Miro)

| Document | Time | Best For |
|----------|------|----------|
| [Which Template?](MIRO_WHICH_TEMPLATE.md) | 2 min | **START HERE** - Decision guide |
| [**Universal App Spec Generator**](UNIVERSAL_APP_SPEC_GENERATOR.md) | 2-4 hours | **⭐ NEW: Works for ANY industry** |
| [Quick Start Guide](MIRO_QUICK_START.md) | 15 min | Step-by-step walkthrough |
| [Checklist](MIRO_CHECKLIST.md) | 5-30 min | Quick planning, brainstorms, MVPs |
| [Quick Template](MIRO_QUICK_TEMPLATE.md) | 2 hours | Card-based planning, workshops |
| [Full Template](MIRO_TEMPLATE.md) | Half day | Complete architecture, production apps |
| [Board Layout](MIRO_BOARD_LAYOUT.md) | 1 hour | Visual setup guide, ongoing projects |

---

## 🎯 QUICK NAVIGATION

### "I want to..."

**...understand the system**
→ Read [Architecture](architecture.md)

**...deploy to production**
→ Follow [Deployment](deployment.md)

**...integrate the frontend**
→ Use [Lovable Integration](lovable-integration.md)

**...add voice features**
→ Use [ElevenLabs Integration](elevenlabs-integration.md)

**...plan a new app with this architecture**
→ Start with [Which Template?](MIRO_WHICH_TEMPLATE.md)

**...see example flows**
→ Check [Examples](../examples/) folder

---

## 📖 READING ORDER

### For Developers

1. [Main README](../README.md) - Get the big picture
2. [Architecture](architecture.md) - Understand the design
3. [Lovable Integration](lovable-integration.md) - Build the frontend
4. [Deployment](deployment.md) - Ship it

### For Architects

1. [Architecture](architecture.md) - System design
2. [Full Template](MIRO_TEMPLATE.md) - Planning framework
3. [Examples](../examples/) - See it in action
4. [Main README](../README.md) - Features and roadmap

### For Product Managers

1. [Main README](../README.md) - What we're building
2. [Board Layout](MIRO_BOARD_LAYOUT.md) - How to track progress
3. [Examples](../examples/) - Use cases
4. [Which Template?](MIRO_WHICH_TEMPLATE.md) - Planning new features

### For Executives

1. [Main README](../README.md) - Vision and value prop
2. [C-Suite Example](../examples/c-suite-quarterly.json) - Executive use case
3. [Deployment](deployment.md) - Cost and timeline

---

## 🏛️ TEMPLE ARCHITECTURE AT A GLANCE

```
USER
 ↓
OUTER COURT (Entry: auth, classify)
 ↓
INNER COURT (Orchestrate: plan, delegate)
 ↓
PRIESTS (Specialize: life, strategy, finance...)
 ↓
SANCTUARY (Synthesize: core logic)
 ↓
ARK (Govern: policies, safety)
 ↓
RIVER (Act: external integrations)
 ↓
MEMORY (Remember: context, history)
```

**The 7 Questions Every Request Answers:**
1. Simple or Complex?
2. Which Priests?
3. What do they contribute?
4. How to synthesize?
5. Any policy violations?
6. What actions to trigger?
7. What to remember?

---

## 🔧 TECH STACK

- **Frontend**: Lovable (React)
- **Backend**: Supabase (Postgres + Edge Functions)
- **LLMs**: OpenAI GPT-4, Anthropic Claude
- **Voice**: ElevenLabs
- **Runtime**: Deno

See [Architecture](architecture.md) for details.

---

## 📊 DOCUMENTATION STATS

- **Total Docs**: 10 files
- **Total Words**: ~50,000
- **Code Examples**: 100+
- **Diagrams**: 10+
- **Example Flows**: 2 complete end-to-end

---

## 🎓 LEARNING PATH

### Beginner (Never seen this before)
1. [Main README](../README.md)
2. [Personal Example](../examples/personal-90-days.json)
3. [Architecture](architecture.md) (skim)
4. [Checklist](MIRO_CHECKLIST.md) (try it!)

### Intermediate (Building with this)
1. [Architecture](architecture.md) (deep read)
2. [Lovable Integration](lovable-integration.md)
3. [Quick Template](MIRO_QUICK_TEMPLATE.md)
4. [Deployment](deployment.md)

### Advanced (Customizing/extending)
1. [Full Template](MIRO_TEMPLATE.md)
2. [Architecture](architecture.md) (study edge functions)
3. [Examples](../examples/) (create your own)
4. Contribute new Priests!

---

## 💡 TIPS FOR USING THESE DOCS

### For Quick Reference
- Use `Ctrl+F` to search
- Check the "Quick Navigation" section above
- Bookmark [Which Template?](MIRO_WHICH_TEMPLATE.md)

### For Deep Learning
- Read in order per "Reading Order" section
- Run the code examples
- Try both example flows

### For Teams
- Share [Which Template?](MIRO_WHICH_TEMPLATE.md) first
- Use [Board Layout](MIRO_BOARD_LAYOUT.md) for workshops
- Export Miro boards as team documentation

---

## 🤝 CONTRIBUTING TO DOCS

Found a typo? See a gap? Want to add an example?

1. Open issue describing the improvement
2. Submit PR with changes
3. Update this README if adding new docs

**Style Guide:**
- Use markdown
- Include code examples
- Add diagrams where helpful
- Keep it practical, not theoretical

---

## 📝 CHANGELOG

### v1.0 (2026-01-06)
- Initial documentation
- 4 Miro templates
- 2 integration guides
- Complete architecture guide
- Deployment guide
- 2 example flows

---

## ❓ FAQ

**Q: Where do I start?**
A: Read [Main README](../README.md), then [Which Template?](MIRO_WHICH_TEMPLATE.md)

**Q: I just want to deploy, what do I read?**
A: [Deployment](deployment.md) has step-by-step instructions

**Q: How do I plan a new feature?**
A: Use [Checklist](MIRO_CHECKLIST.md) for quick features, [Quick Template](MIRO_QUICK_TEMPLATE.md) for complex ones

**Q: Can I use this architecture for non-AI apps?**
A: Yes! The temple pattern works for any system. Adapt as needed.

**Q: Are there video tutorials?**
A: Not yet. Coming in v1.1. For now, docs + code examples.

**Q: Where's the API reference?**
A: Check individual Edge Function files in `/supabase/functions/`

---

## 🚀 NEXT STEPS

1. ✅ Read this README
2. [ ] Choose your path (Developer/Architect/PM)
3. [ ] Follow reading order for your role
4. [ ] Try a Miro template
5. [ ] Build something!

---

## 📞 SUPPORT

- **GitHub Issues**: Bug reports, feature requests
- **GitHub Discussions**: Questions, ideas, showcase
- **Email**: support@templeos.com (if applicable)

---

**Happy building!** 🏛️

May your code be modular,
Your architecture clear,
And your deployments smooth.

— The Temple OS Team

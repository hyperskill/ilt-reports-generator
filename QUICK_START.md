# ⚡ LLM Reports - Quick Start Checklist

## Setup (5 minutes)

### ☐ 1. Install Dependencies
```bash
npm install
```

### ☐ 2. Get LiteLLM API Key
- You should already have this from Hyperskill
- Key starts with `sk-`
- Base URL: Contact your admin for the LiteLLM endpoint

### ☐ 3. Add to Environment
```bash
# Edit .env.local
LITELLM_API_KEY=your_litellm_api_key_here
LITELLM_BASE_URL=your_litellm_base_url_here
```

### ☐ 4. Run Database Migration
- Open Supabase dashboard → SQL Editor
- Copy/paste: `supabase/add-llm-reports.sql`
- Click "Run"

### ☐ 5. Start Server
```bash
npm run dev
```

---

## Test (2 minutes)

### ☐ 6. Login as Admin
- Go to http://localhost:3000
- Login with admin account

### ☐ 7. Open a Report
- Navigate to any saved report
- Look for "AI-Generated Reports" card

### ☐ 8. Generate Test Report
- Click "🤖 Generate Manager Report"
- Wait 10-30 seconds
- Review the result!

---

## ✅ Success!
If you see the generated report, everything works!

**Next**: Read `docs/LLM_USER_GUIDE.md` for full workflow

---

## 🆘 Issues?

| Problem | Fix |
|---------|-----|
| "Unauthorized" | Check admin role in `/profile` |
| "Module not found" | Run `npm install` |
| "Failed to generate" | Check LiteLLM API key and base URL |
| Tables missing | Run database migration |

**Full troubleshooting**: `docs/LLM_SETUP.md`


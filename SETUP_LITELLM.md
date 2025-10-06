# ⚡ LiteLLM Setup for Your Project

## ✅ What's Already Done

Application code updated to work with LiteLLM instead of OpenAI:
- ✅ API routes use `LITELLM_API_KEY` and `LITELLM_BASE_URL`
- ✅ Documentation updated
- ✅ env.example updated

## 🔧 What You Need to Do

### 1. Create `.env.local` File

```bash
# In project root, create .env.local file
touch .env.local
```

### 2. Add Your Keys to `.env.local`

Open `.env.local` and add:

```bash
# Supabase (your existing keys)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# LiteLLM (your new keys)
LITELLM_API_KEY=sk-T7_jQMSloCTpbpv2F3mc_Q
LITELLM_BASE_URL=https://litellm.aks-hs-prod.int.hyperskill.org
```

### 3. Restart Dev Server

If server is already running, stop it (Ctrl+C) and start again:

```bash
npm run dev
```

## ✨ Done!

Application will now use Hyperskill's internal LiteLLM proxy instead of OpenAI.

## 🧪 Testing

1. Login as admin
2. Open any saved report
3. Click "🤖 Generate Manager Report"
4. If generation successful - everything works! 🎉

## 🐛 Issues?

### Error "Failed to generate report"
- Check that `.env.local` contains both parameters:
  - `LITELLM_API_KEY`
  - `LITELLM_BASE_URL`
- Make sure you're on Hyperskill network (VPN may be required)
- Restart dev server after changing `.env.local`

### Error "Module not found: openai"
```bash
npm install
```

### Check Environment Variables
Add temporarily at start of API route for debugging:
```typescript
console.log('LiteLLM Config:', {
  apiKey: process.env.LITELLM_API_KEY?.substring(0, 10) + '...',
  baseURL: process.env.LITELLM_BASE_URL
});
```

## 📊 OpenAI vs LiteLLM Differences

| Parameter | OpenAI | LiteLLM |
|----------|--------|---------|
| API Key | `OPENAI_API_KEY` | `LITELLM_API_KEY` |
| Base URL | (default) | `LITELLM_BASE_URL` |
| Model | `gpt-4o` | `gpt-4o` (same) |
| API Format | OpenAI compatible | OpenAI compatible |
| Cost | Direct through OpenAI | Through Hyperskill |

## 💡 Notes

- LiteLLM uses the same API interface as OpenAI
- The `openai` npm package is compatible with LiteLLM
- Only need to specify `baseURL` when initializing client
- Model remains `gpt-4o` as before

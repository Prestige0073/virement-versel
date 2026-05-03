# 🗄️ Supabase Storage Configuration - Bank Logos

**Document**: Setup instructions for Supabase Storage bucket  
**Date**: 3 mai 2026  
**Phase**: 4 - Bank Account Management

---

## 📌 Overview

BankAccountForm allows users to upload bank logos to Supabase Storage. This document provides step-by-step instructions to configure the storage bucket.

---

## 🚀 Setup Instructions

### Step 1: Create Storage Bucket

1. Go to **Supabase Dashboard** → Your Project
2. In the left sidebar, click **Storage**
3. Click **New Bucket**
4. Enter bucket name: `bank-logos`
5. Make bucket **Public** (so logos are accessible via public URL)
6. Click **Create Bucket**

### Step 2: Configure RLS Policies

Go to **Storage → Policies** for the `bank-logos` bucket.

#### Policy 1: Allow Public Read
```sql
CREATE POLICY "Allow public read on bank-logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'bank-logos');
```

#### Policy 2: Allow Users Upload to Own Folder
```sql
CREATE POLICY "Allow users upload to own folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'bank-logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

#### Policy 3: Allow Users Update Own Files
```sql
CREATE POLICY "Allow users update own files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'bank-logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'bank-logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

#### Policy 4: Allow Users Delete Own Files
```sql
CREATE POLICY "Allow users delete own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'bank-logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### Step 3: Verify CORS Settings

Go to **Settings → API** and verify CORS is configured:

```json
[
  {
    "origin": [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://yourdomain.com"
    ],
    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "allowedHeaders": ["*"],
    "credentials": true
  }
]
```

---

## 🔧 Environment Variables

Add these to your `.env.local`:

```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Already configured in `frontend/src/config/supabase.js`:

```javascript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);
```

---

## 📦 Upload Implementation

The `uploadBankLogo` function in `BankAccountContext.jsx` handles uploads:

```javascript
const uploadBankLogo = async (file, userId) => {
  try {
    // Validate file type
    const acceptedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!acceptedTypes.includes(file.type)) {
      throw new Error('Format invalide');
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Image trop volumineuse');
    }

    // Upload with user ID as folder
    const fileName = `${userId}/${Date.now()}-${file.name}`;
    
    const { data, error } = await supabase.storage
      .from('bank-logos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('bank-logos')
      .getPublicUrl(data.path);

    return publicUrl;
  } catch (err) {
    console.error('Logo upload error:', err);
    throw err;
  }
};
```

---

## 🔒 Security Features

### File Type Validation
- Only PNG, JPEG, WebP accepted
- MIME type checked on upload
- Prevents malicious file uploads

### File Size Limits
- Maximum 5MB per file
- Prevents storage abuse
- Optimal for web display

### Folder Structure
- Organized by user ID: `userId/timestamp-filename`
- Prevents filename collisions
- Easy cleanup per user

### Public Access
- Logos are publicly readable (necessary for display)
- Users can only upload/delete their own files
- No direct path manipulation possible

---

## 📊 Storage Management

### Monitor Usage
1. Go to **Settings → Usage**
2. Check storage capacity
3. Review bandwidth usage

### Clean Up Old Files
```javascript
// Optional: Implement auto-cleanup in backend
const cleanupOldLogos = async (userId, daysOld = 30) => {
  const cutoffDate = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
  
  // List files
  const { data: files } = await supabase.storage
    .from('bank-logos')
    .list(userId, { sortBy: { column: 'created_at', order: 'desc' } });
  
  // Delete old files
  for (const file of files) {
    const fileDate = new Date(file.created_at).getTime();
    if (fileDate < cutoffDate) {
      await supabase.storage
        .from('bank-logos')
        .remove([`${userId}/${file.name}`]);
    }
  }
};
```

---

## 🧪 Testing Upload

### Test Locally

1. **Start dev server**: `npm run dev`
2. **Login** to app
3. **Go to Bank Accounts** page
4. **Create new account**
5. **Upload PNG/JPEG file** (< 5MB)
6. **Verify preview** shows
7. **Submit form**
8. **Check Supabase Storage** → bank-logos bucket
9. **Verify file** appears in `userId/` folder
10. **Check database** → `bank_logo_url` populated

### Expected Behavior
```
Input: account_logo.png (2MB)
↓
Validation:
  - Type: image/png ✓
  - Size: 2MB < 5MB ✓
↓
Upload path: `user-id-uuid/1714752000000-account_logo.png`
↓
Public URL: https://project.supabase.co/storage/v1/object/public/bank-logos/user-id-uuid/...
↓
Saved to DB: bank_accounts.bank_logo_url
```

---

## 🐛 Troubleshooting

### Upload Fails with "CORS Error"
**Solution**: Update CORS settings in Supabase Settings → API

### Upload Fails with "Permission Denied"
**Solution**: Verify RLS policies are enabled and correct

### File Not Appearing in Bucket
**Solution**: Check browser console for error messages

### Logo URL Returns 404
**Solution**: Verify bucket is PUBLIC and file path is correct

### File Size Limit Error
**Solution**: Compress image before upload (use online compressor)

### Wrong File Type Error
**Solution**: Only PNG, JPEG, WebP supported. Convert if needed.

---

## 📝 Checklist

Setup verification:

- [ ] Bucket `bank-logos` created
- [ ] Bucket set to PUBLIC
- [ ] RLS Policies configured (4 policies)
- [ ] CORS configuration verified
- [ ] Environment variables set
- [ ] Test upload successful
- [ ] File appears in Storage bucket
- [ ] Public URL accessible
- [ ] Database record saved
- [ ] Logo displays on account card

---

## 🔗 Documentation Links

- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [Supabase RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase API Reference](https://supabase.com/docs/reference/javascript/storage-from-upload)

---

## ✅ Status

✅ **Configuration Ready for Implementation**

All RLS policies and security settings documented and ready to deploy.

---

**Last Updated**: 3 mai 2026  
**Status**: ✅ Complete

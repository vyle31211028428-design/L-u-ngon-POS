# Vercel Deployment Guide - Lẩu Ngon POS

## 📋 Bước 1: Chuẩn bị

### 1.1 Đăng ký/Đăng nhập Vercel
- Vào https://vercel.com
- Tạo tài khoản hoặc đăng nhập
- Kết nối với GitHub account

### 1.2 Push code lên GitHub
```bash
# Từ project folder
git add -A
git commit -m "Setup Vercel deployment"
git push origin main
```

## 🚀 Bước 2: Deploy trên Vercel

### 2.1 Tạo Project trên Vercel
1. Vào https://vercel.com/dashboard
2. Bấm **"Add New..." → "Project"**
3. Chọn repository `lẩu-ngon-pos` từ GitHub
4. Bấm **"Import"**

### 2.2 Cấu hình Environment Variables
Trên trang cấu hình Vercel, thêm các biến:

| Tên | Giá trị | Mô tả |
|-----|--------|-------|
| VITE_SUPABASE_URL | `https://xxx.supabase.co` | Lấy từ Supabase |
| VITE_SUPABASE_ANON_KEY | `eyJxx...` | Lấy từ Supabase |

**Cách lấy từ Supabase:**
1. Vào https://app.supabase.com
2. Chọn project
3. Settings → API
4. Copy "Project URL" và "anon/public" key

### 2.3 Build Settings
Vercel sẽ tự nhận diện Vite framework:
- **Framework**: Vite (auto-detected)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

Bấm **"Deploy"** để bắt đầu build

## ✅ Bước 3: Xác minh Deploy

### 3.1 Kiểm tra Build Status
- Xem log build trên Vercel dashboard
- Đợi deploy hoàn tất (thường 2-3 phút)
- Khi thành công sẽ có domain tạo sẵn

### 3.2 Test Ứng dụng
1. Vào URL được cấp bởi Vercel
2. Test login với username + PIN
3. Test tất cả features (Admin, Kitchen, Cashier, etc.)

### 3.3 Custom Domain (Optional)
1. Vercel Dashboard → Project Settings
2. Domains → Add domain
3. Thêm domain riêng của bạn
4. Update DNS records theo hướng dẫn

## 🔧 Bước 4: Cấu hình tự động redeploy

### 4.1 GitHub Integration (Tự động)
- Vercel tự động redeploy khi push code lên `main` branch
- Mỗi Pull Request sẽ tạo Preview Deployment
- Có thể merge khi preview passes

### 4.2 Tắt Auto-deployment (Optional)
Settings → Git → Deploy on push → Tắt

## 🐛 Troubleshooting

### Build Failed
**Lỗi**: `VITE_SUPABASE_URL is not defined`
- **Cách sửa**: Kiểm tra lại Environment Variables đã thêm chưa

**Lỗi**: `Module not found`
- **Cách sửa**: Chạy `npm install` locally, commit `package-lock.json`

### Login không hoạt động
- Kiểm tra VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
- Kiểm tra RLS policy trên Supabase
- Kiểm tra CORS settings

### Chậm/Timeout
- Tăng timeout trong Vercel settings
- Check Supabase connection
- Verify có đủ Supabase quota không

## 📊 Monitoring

### Xem Logs
Vercel Dashboard → Project → Deployments → Recent → View Logs

### Performance
Vercel Dashboard → Analytics tab

### Errors
Vercel Dashboard → Errors tab (nếu có)

## 🔄 Quản lý Deployments

### Rollback (Quay lại version cũ)
1. Vercel Dashboard → Deployments
2. Tìm deployment cũ muốn quay lại
3. Bấm "..." → "Promote to Production"

### Environment per Branch
Vercel hỗ trợ:
- **Production** → từ main branch
- **Preview** → từ mọi PR / branch khác
- **Development** → test URL riêng

## 💾 Backup & Security

### Khi có lỗi production
```bash
# Quay lại version trước
git revert HEAD
git push origin main
# Vercel tự động redeploy
```

### Bảo vệ secrets
- Không bao giờ commit `.env` file
- Supabase keys chỉ set trong Environment Variables
- Enable 2FA trên Vercel account

## 📱 Custom Domain + HTTPS
- HTTPS tự động (miễn phí)
- Custom domain có thể setup trong 5 phút
- Certificate renew tự động

---

## 🎯 Checklist trước Deploy

- [ ] Code đã push lên GitHub
- [ ] `.env.example` có mẫu cho environment variables
- [ ] `package.json` có build script đúng
- [ ] `vite.config.ts` configured đúng
- [ ] `vercel.json` có trong project
- [ ] Supabase credentials chuẩn bị sẵn
- [ ] Database migration đã chạy trên Supabase
- [ ] Test local build: `npm run build && npm run preview`

## ❓ Support

- Vercel Docs: https://vercel.com/docs
- Vite Docs: https://vitejs.dev
- Supabase Docs: https://supabase.com/docs

**Nếu có vấn đề, check:**
1. Vercel logs
2. Browser console (F12)
3. Network tab
4. Supabase logs

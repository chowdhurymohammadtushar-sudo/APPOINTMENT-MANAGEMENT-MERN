# দ্রুত চালু করার নিয়ম

## প্রয়োজন
- Node.js 18+
- MongoDB Local অথবা MongoDB Atlas

## ধাপ ১: Environment file

`server/.env.example` কপি করে `server/.env` বানান।

Windows PowerShell:
```powershell
Copy-Item server/.env.example server/.env
Copy-Item client/.env.example client/.env
```

Linux/macOS:
```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

তারপর `server/.env`-এ MongoDB connection এবং JWT secret দিন।

## ধাপ ২: Dependency install

Project root থেকে:
```bash
npm run install:all
```

## ধাপ ৩: Admin তৈরি

```bash
npm run seed:admin
```

Admin email/password `server/.env`-এর `ADMIN_EMAIL` এবং `ADMIN_PASSWORD` থেকে নেওয়া হবে।

## ধাপ ৪: Project চালু

```bash
npm run dev
```

- Client: http://localhost:5173
- API: http://localhost:5000/api

## ব্যবহার পদ্ধতি

1. Doctor account register করুন।
2. Admin account দিয়ে login করে doctor approve করুন।
3. Doctor login করে weekly schedule যোগ করুন।
4. Patient account register/login করুন।
5. Doctor নির্বাচন করে date এবং available slot বুক করুন।
6. Doctor appointment confirm/reject/complete করতে পারবে।


# 🍬 Al-Ghani Sweets & Bakers — E-Commerce Platform

**A full-stack e-commerce web platform for Al-Ghani Sweets & Bakers — a traditional Pakistani sweets, bakery, and fast food brand in Kahuta, Punjab.**

Public storefront with product catalogs, cart & checkout, order tracking, and a secure admin dashboard for managing products, orders, and store settings.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20Site-black?style=for-the-badge&logo=vercel)](https://alghani-sweets-bakers.vercel.app)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

🔗 **[alghani-sweets-bakers.vercel.app](https://alghani-sweets-bakers.vercel.app)**

</div>

---

## 📖 Overview

**Al-Ghani Sweets & Bakers** is a full-stack online store built with **Next.js** and **TypeScript**. It combines a fast, mobile-friendly storefront — traditional mithai, custom occasion cakes, and fast food, with cart, checkout, and order tracking — with a secure, database-backed **admin dashboard** for managing the catalog, orders, and store settings.

---

## ✨ Features

### 🛍️ Storefront
- **Product Catalog** — Sweets, Cakes, Custom Cakes, Fast Food & Deals, Desserts, Biscuits & Cookies, Frozen, Gift Essentials, Packed Products
- **Weight/Size Variants** — Sweets sold by weight (250g / 500g / 1kg) with per-variant pricing
- **Cart & Checkout** — Persistent cart, delivery details, and multiple payment methods (Cash on Delivery, JazzCash, Easypaisa, Meezan Bank transfer, cards)
- **Order Tracking** — Customers can track an order and view a confirmation page after checkout
- **Complaint Submission** — Dedicated "Submit Complaint" flow from the header
- **WhatsApp Integration** — Floating WhatsApp button and WhatsApp-based ordering/inquiries
- **Responsive Design** — Built with Tailwind CSS for a smooth experience across devices

### 🔐 Admin Dashboard
- **Secure Authentication** — Session-based admin/staff login
- **Dashboard Stats** — At-a-glance store performance overview
- **Order Management** — View and update order and payment status
- **Product Management** — Full CRUD for products, including images, pricing per weight/size, stock, and category/subcategory
- **Store Settings** — Manage configurable store settings from the dashboard

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js](https://nextjs.org/) (App Router) |
| Language | TypeScript |
| Database & Storage | [Supabase](https://supabase.com/) (Postgres + object storage for product images) |
| Styling | Tailwind CSS |
| Auth | Session-based admin/staff login |
| Deployment | Vercel |

> ℹ️ Adjust this table to match your actual `package.json` if any of these differ.

---

## 📁 Project Structure

```text
src/
├── app/
│   ├── admin/               # Admin dashboard (login, products, orders, settings)
│   ├── api/
│   │   ├── admin/           # Admin-only API routes (auth, products, orders, stats, settings)
│   │   ├── orders/          # Public order APIs
│   │   └── products/        # Public product APIs
│   ├── cakes/, fast-food/, biscuits-cookies/, gift-essentials/   # Category pages
│   ├── support/             # Support & help centre
│   ├── track-order/         # Order tracking
│   └── legal/               # Privacy policy, terms, refund, shipping, disclaimer
├── components/               # Header, footer, product cards, cart, WhatsApp button, etc.
└── lib/                       # Auth helpers, cart context, formatting utilities
```

> ℹ️ This is a best-guess structure based on the live site's routes — replace it with your real folder layout.

---

## 🗄️ Database Schema (indicative)

| Table | Purpose |
|---|---|
| `products` | Product catalog — name, category/subcategory, weight variants, pricing (PKR), stock, images, featured flags |
| `orders` | Customer orders — items, delivery info, payment method/status, order status |
| `admins` | Admin/staff accounts |
| `store_settings` | Key-value store for configurable site settings |
| `complaints` | Customer complaint submissions |

> ℹ️ Update this to match your actual schema.

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/saadullah990123/Alghani-Sweets-Bakers.git
cd Alghani-Sweets-Bakers
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
Create a `.env` file in the root:
```env
DATABASE_URL=your_supabase_or_postgres_connection_string
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ADMIN_SESSION_SECRET=your_random_secret_key
```

### 4. Run the development server
```bash
npm run dev
```

Visit **`http://localhost:3000`** for the storefront, and **`http://localhost:3000/admin`** for the admin dashboard.

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Build for production |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |

---

## 📸 Preview

<div align="center">

### 🏠 Homepage

<img width="1916" height="912" alt="image" src="https://github.com/user-attachments/assets/589f600e-6184-4343-9b4c-5997c6fefd57" />

<img width="1901" height="887" alt="image" src="https://github.com/user-attachments/assets/bcc98a71-062e-470f-9fe7-3bf6085b9d02" />


### 🍬 Sweets & Cakes
<img width="1882" height="911" alt="image" src="https://github.com/user-attachments/assets/c30e92ee-106e-4cfd-b336-00c757e76f8e" />

<img width="1906" height="910" alt="image" src="https://github.com/user-attachments/assets/2f87cfe7-4b86-417f-93b4-298dbfc336bd" />


###  📦 Order

<img width="1917" height="908" alt="image" src="https://github.com/user-attachments/assets/27a0a4ae-e5a0-4297-bb58-31f7046ef596" />

<img width="1012" height="905" alt="image" src="https://github.com/user-attachments/assets/8eab2918-0710-4f56-a569-64c600619e16" />


### 🏪 Front Store

<img width="1911" height="833" alt="image" src="https://github.com/user-attachments/assets/dba5d50c-70a4-4a92-a2ff-3e4203104669" />

<img width="1917" height="913" alt="image" src="https://github.com/user-attachments/assets/12318c5f-615c-43c2-b664-f3d480c7c0a4" />

### 🔐 Admin Dashboard

<img width="1901" height="911" alt="image" src="https://github.com/user-attachments/assets/fdd2cd66-e171-445d-a83f-9f76bc5ba827" />

<img width="1907" height="908" alt="image" src="https://github.com/user-attachments/assets/95a503c7-2e19-4faf-a678-052c7acbf632" />


</div>


---

## 📄 License

This project is privately owned by **Al-Ghani Sweets & Bakers**. All rights reserved © 2026.

---

<div align="center">


Designed & Developed with ❤️ by **Saad Ullah** for **Al-Ghani Sweets & Bakers**
</div>

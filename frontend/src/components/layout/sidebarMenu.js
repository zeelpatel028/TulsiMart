import {
  Store,
  Wallet,
  LayoutDashboard,
  ShoppingCart,
  ShoppingBag,
  Layers,
  Users,
  Truck,
  Tag,
  Receipt,
  TrendingUp,
  FileText,
  ShieldCheck,
  Settings
} from 'lucide-react';

export const sidebarMenu = [
  {
    title: "DAILY STORE OPERATIONS",
    items: [
      {
        name: "Make Bills (POS)",
        path: "/pos",
        icon: Store,
        badge: "COUNTER"
      },
      {
        name: "Today's Collection",
        path: "/collection",
        icon: Wallet,
        badge: "CASH"
      },
      {
        name: "Store Dashboard",
        path: "/dashboard",
        icon: LayoutDashboard
      }
    ]
  },
  {
    title: "STORE CATALOG & STOCK",
    items: [
      {
        name: "Bill Management",
        path: "/bills",
        icon: ShoppingCart
      },
      {
        name: "Add Product",
        path: "/products/add",
        icon: ShoppingBag
      },
      {
        name: "Stock & Inventory",
        path: "/inventory",
        icon: Layers
      },
      {
        name: "Customers",
        path: "/customers",
        icon: Users
      },
      {
        name: "Suppliers",
        path: "/suppliers",
        icon: Truck
      },
      {
        name: "Offers & Coupons",
        path: "/offers",
        icon: Tag
      }
    ]
  },
  {
    title: "ACCOUNTS & REPORTS",
    items: [
      {
        name: "Store Expenses",
        path: "/expenses",
        icon: Receipt
      },
      {
        name: "Sales & Revenue",
        path: "/sales",
        icon: TrendingUp
      },
      {
        name: "Reports & Analytics",
        path: "/reports",
        icon: FileText
      }
    ]
  },
  {
    title: "STAFF & STORE SETTINGS",
    items: [
      {
        name: "Staff",
        path: "/staff",
        icon: ShieldCheck,
        badge: "ADMIN"
      },
      {
        name: "Store Settings",
        path: "/settings",
        icon: Settings
      }
    ]
  }
];

export default sidebarMenu;

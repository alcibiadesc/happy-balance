import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create default categories
  const categories = [
    // Expense categories
    {
      id: "1",
      name: "Food & Dining",
      type: "essential",
      color: "#FF6B6B",
      icon: "🍽️",
    },
    {
      id: "2",
      name: "Transportation",
      type: "essential",
      color: "#4ECDC4",
      icon: "🚗",
    },
    {
      id: "3",
      name: "Shopping",
      type: "discretionary",
      color: "#45B7D1",
      icon: "🛍️",
    },
    {
      id: "4",
      name: "Entertainment",
      type: "discretionary",
      color: "#F7931E",
      icon: "🎬",
    },
    {
      id: "5",
      name: "Bills & Utilities",
      type: "essential",
      color: "#FF9F43",
      icon: "💡",
    },
    {
      id: "6",
      name: "Healthcare",
      type: "essential",
      color: "#26DE81",
      icon: "🏥",
    },
    {
      id: "7",
      name: "Education",
      type: "discretionary",
      color: "#A55EEA",
      icon: "📚",
    },
    {
      id: "8",
      name: "Travel",
      type: "discretionary",
      color: "#FD79A8",
      icon: "✈️",
    },

    // Income categories
    { id: "9", name: "Salary", type: "INCOME", color: "#00B894", icon: "💼" },
    {
      id: "10",
      name: "Freelance",
      type: "income",
      color: "#0984E3",
      icon: "💻",
    },
    {
      id: "11",
      name: "Investment Returns",
      type: "income",
      color: "#6C5CE7",
      icon: "📈",
    },
    {
      id: "12",
      name: "Other Income",
      type: "income",
      color: "#A29BFE",
      icon: "💰",
    },

    // Investment categories
    {
      id: "13",
      name: "Stocks",
      type: "investment",
      color: "#00B894",
      icon: "📊",
    },
    {
      id: "14",
      name: "Bonds",
      type: "investment",
      color: "#0984E3",
      icon: "🏦",
    },
    {
      id: "15",
      name: "Crypto",
      type: "investment",
      color: "#FDCB6E",
      icon: "₿",
    },
    {
      id: "16",
      name: "Real Estate",
      type: "investment",
      color: "#E17055",
      icon: "🏠",
    },

    // Debt Payment categories
    {
      id: "17",
      name: "Mortgage",
      type: "debt_payment",
      color: "#DC2626",
      icon: "🏠",
    },
    {
      id: "18",
      name: "Credit Card",
      type: "debt_payment",
      color: "#A855F7",
      icon: "💳",
    },
    {
      id: "19",
      name: "Personal Loan",
      type: "debt_payment",
      color: "#F59E0B",
      icon: "💰",
    },
    {
      id: "20",
      name: "Student Loan",
      type: "debt_payment",
      color: "#EF4444",
      icon: "🎓",
    },
    {
      id: "21",
      name: "Car Loan",
      type: "debt_payment",
      color: "#7C3AED",
      icon: "🚗",
    },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { id: category.id },
      update: {},
      create: category,
    });
  }

  // Create default app settings
  const settings = [
    {
      id: "1",
      key: "default_currency",
      value: "EUR",
      description: "Default currency for transactions",
    },
    {
      id: "2",
      key: "dashboard_date_range",
      value: "last_30_days",
      description: "Default date range for dashboard",
    },
    {
      id: "3",
      key: "auto_categorization_enabled",
      value: true,
      description: "Enable automatic transaction categorization",
    },
    {
      id: "4",
      key: "duplicate_detection_enabled",
      value: true,
      description: "Enable duplicate transaction detection",
    },
  ];

  for (const setting of settings) {
    await prisma.appSettings.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  // Create default user preferences
  await prisma.userPreferences.upsert({
    where: { userId: "default" },
    update: {},
    create: {
      userId: "default",
      currency: "EUR",
      language: "en",
      theme: "light",
    },
  });

  // Create sample transactions for development (only if ENABLE_SEED_DATA is true)
  if (process.env.ENABLE_SEED_DATA === "true") {
    const sampleTransactions = [
      {
        id: "sample-1",
        amount: -25.5,
        currency: "EUR",
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        merchant: "Starbucks Coffee",
        type: "EXPENSE",
        description: "Morning coffee",
        categoryId: "1", // Food & Dining
        hash: "sample-hash-1",
      },
      {
        id: "sample-2",
        amount: -45.2,
        currency: "EUR",
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        merchant: "Uber",
        type: "EXPENSE",
        description: "Ride to work",
        categoryId: "2", // Transportation
        hash: "sample-hash-2",
      },
      {
        id: "sample-3",
        amount: 2500.0,
        currency: "EUR",
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        merchant: "Company Inc.",
        type: "income",
        description: "Monthly salary",
        categoryId: "9", // Salary
        hash: "sample-hash-3",
      },
      {
        id: "sample-4",
        amount: -89.99,
        currency: "EUR",
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        merchant: "Amazon",
        type: "EXPENSE",
        description: "Online shopping",
        categoryId: "3", // Shopping
        hash: "sample-hash-4",
      },
      {
        id: "sample-5",
        amount: -120.0,
        currency: "EUR",
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        merchant: "Electric Company",
        type: "EXPENSE",
        description: "Monthly electricity bill",
        categoryId: "5", // Bills & Utilities
        hash: "sample-hash-5",
      },
      {
        id: "sample-6",
        amount: -1200.0,
        currency: "EUR",
        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        merchant: "Bank Mortgage",
        type: "EXPENSE",
        description: "Monthly mortgage payment",
        categoryId: "17", // Mortgage
        hash: "sample-hash-6",
      },
      {
        id: "sample-7",
        amount: -250.0,
        currency: "EUR",
        date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), // 12 days ago
        merchant: "Credit Card Company",
        type: "EXPENSE",
        description: "Credit card payment",
        categoryId: "18", // Credit Card
        hash: "sample-hash-7",
      },
    ];

    for (const transaction of sampleTransactions) {
      await prisma.transaction.upsert({
        where: { id: transaction.id },
        update: {},
        create: transaction,
      });
    }
  }
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

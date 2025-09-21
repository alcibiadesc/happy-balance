import { Request, Response } from "express";
import { PrismaCategoryRepository } from "@infrastructure/repositories/PrismaCategoryRepository";
import { PrismaUserPreferencesRepository } from "@infrastructure/repositories/PrismaUserPreferencesRepository";
import { prisma } from "@infrastructure/database/prisma";

export class SeedController {
  private categoryRepository: PrismaCategoryRepository;
  private userPreferencesRepository: PrismaUserPreferencesRepository;

  constructor(
    categoryRepository: PrismaCategoryRepository,
    userPreferencesRepository: PrismaUserPreferencesRepository,
  ) {
    this.categoryRepository = categoryRepository;
    this.userPreferencesRepository = userPreferencesRepository;
  }

  /**
   * Internal method to perform the seeding without HTTP dependencies
   */
  async performReset(): Promise<{
    categories: number;
    settings: number;
    userPreferences: number;
  }> {
    // Default categories structure from seed.ts
    const defaultCategories = [
      // Essential categories
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
      // Discretionary categories
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
      {
        id: "9",
        name: "Salary",
        type: "income",
        color: "#00B894",
        icon: "💼",
      },
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
      // No Compute categories
      {
        id: "22",
        name: "Account Transfer",
        type: "no_compute",
        color: "#6B7280",
        icon: "🔄",
      },
      {
        id: "23",
        name: "Bank Transfer",
        type: "no_compute",
        color: "#9CA3AF",
        icon: "🏦",
      },
      {
        id: "24",
        name: "Internal Movement",
        type: "no_compute",
        color: "#4B5563",
        icon: "↔️",
      },
    ];

    // Default app settings
    const defaultSettings = [
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

    // Reset categories using upsert to avoid conflicts
    for (const category of defaultCategories) {
      await prisma.category.upsert({
        where: { id: category.id },
        update: {
          name: category.name,
          type: category.type,
          color: category.color,
          icon: category.icon,
        },
        create: category,
      });
    }

    // Reset app settings
    for (const setting of defaultSettings) {
      await prisma.appSettings.upsert({
        where: { key: setting.key },
        update: {
          value: setting.value,
          description: setting.description,
        },
        create: setting,
      });
    }

    // Reset default user preferences
    await prisma.userPreferences.upsert({
      where: { userId: "default" },
      update: {
        currency: "EUR",
        language: "en",
        theme: "light",
      },
      create: {
        userId: "default",
        currency: "EUR",
        language: "en",
        theme: "light",
      },
    });

    return {
      categories: defaultCategories.length,
      settings: defaultSettings.length,
      userPreferences: 1,
    };
  }

  async resetToDefaults(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.performReset();
      res.json({
        success: true,
        message: "Data has been successfully reset to defaults",
        resetItems: result,
      });
    } catch (error) {
      console.error("Error resetting data to defaults:", error);
      res.status(500).json({
        success: false,
        error: "Failed to reset data to defaults",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}

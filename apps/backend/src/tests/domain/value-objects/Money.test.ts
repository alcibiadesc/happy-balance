import { describe, it, expect } from "vitest";
import { Money } from "@domain/value-objects/Money";

describe("Money Value Object", () => {
  describe("create", () => {
    it("should create a valid Money instance", () => {
      const result = Money.create(100, "EUR");

      expect(result.isSuccess()).toBe(true);
      const money = result.getValue();
      expect(money.amount).toBe(100);
      expect(money.currency).toBe("EUR");
    });

    it("should fail with negative amount", () => {
      const result = Money.create(-100, "EUR");

      expect(result.isFailure()).toBe(true);
      expect(result.getError().message).toContain("Amount must be positive");
    });

    it("should fail with invalid currency", () => {
      const result = Money.create(100, "INVALID");

      expect(result.isFailure()).toBe(true);
      expect(result.getError().message).toContain("Invalid currency");
    });

    it("should fail with NaN amount", () => {
      const result = Money.create(NaN, "EUR");

      expect(result.isFailure()).toBe(true);
      expect(result.getError().message).toContain(
        "Amount must be a valid number",
      );
    });

    it("should handle zero amount", () => {
      const result = Money.create(0, "EUR");

      expect(result.isSuccess()).toBe(true);
      const money = result.getValue();
      expect(money.amount).toBe(0);
    });

    it("should handle decimal amounts", () => {
      const result = Money.create(99.99, "EUR");

      expect(result.isSuccess()).toBe(true);
      const money = result.getValue();
      expect(money.amount).toBe(99.99);
    });
  });

  describe("operations", () => {
    it("should add two Money values with same currency", () => {
      const money1 = Money.create(100, "EUR").getValue();
      const money2 = Money.create(50, "EUR").getValue();

      const result = money1.add(money2);

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().amount).toBe(150);
    });

    it("should fail adding Money with different currencies", () => {
      const money1 = Money.create(100, "EUR").getValue();
      const money2 = Money.create(50, "USD").getValue();

      const result = money1.add(money2);

      expect(result.isFailure()).toBe(true);
      expect(result.getError().message).toContain("Currency mismatch");
    });

    it("should subtract two Money values with same currency", () => {
      const money1 = Money.create(100, "EUR").getValue();
      const money2 = Money.create(30, "EUR").getValue();

      const result = money1.subtract(money2);

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().amount).toBe(70);
    });

    it("should multiply Money by a scalar", () => {
      const money = Money.create(100, "EUR").getValue();

      const result = money.multiply(1.5);

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().amount).toBe(150);
    });

    it("should divide Money by a scalar", () => {
      const money = Money.create(100, "EUR").getValue();

      const result = money.divide(2);

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().amount).toBe(50);
    });

    it("should fail dividing by zero", () => {
      const money = Money.create(100, "EUR").getValue();

      const result = money.divide(0);

      expect(result.isFailure()).toBe(true);
      expect(result.getError().message).toContain("Cannot divide by zero");
    });
  });

  describe("comparison", () => {
    it("should correctly compare equal Money values", () => {
      const money1 = Money.create(100, "EUR").getValue();
      const money2 = Money.create(100, "EUR").getValue();

      expect(money1.equals(money2)).toBe(true);
    });

    it("should correctly compare different amounts", () => {
      const money1 = Money.create(100, "EUR").getValue();
      const money2 = Money.create(200, "EUR").getValue();

      expect(money1.equals(money2)).toBe(false);
      expect(money1.isLessThan(money2)).toBe(true);
      expect(money2.isGreaterThan(money1)).toBe(true);
    });

    it("should not compare Money with different currencies", () => {
      const money1 = Money.create(100, "EUR").getValue();
      const money2 = Money.create(100, "USD").getValue();

      expect(money1.equals(money2)).toBe(false);
    });
  });

  describe("formatting", () => {
    it("should format Money as string", () => {
      const money = Money.create(1234.56, "EUR").getValue();

      expect(money.toString()).toBe("€1,234.56");
    });

    it("should format USD correctly", () => {
      const money = Money.create(1234.56, "USD").getValue();

      expect(money.toString()).toBe("$1,234.56");
    });

    it("should handle zero formatting", () => {
      const money = Money.create(0, "EUR").getValue();

      expect(money.toString()).toBe("€0.00");
    });

    it("should round to 2 decimal places", () => {
      const money = Money.create(99.999, "EUR").getValue();

      expect(money.toString()).toBe("€100.00");
    });
  });
});

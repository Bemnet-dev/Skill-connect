import { describe, it, expect } from "@jest/globals";
import {
  brand,
  brandTokens,
  grayTokens,
  semanticTokens,
  badgeTokens,
  designTokens,
} from "@/lib/tokens";

describe("Design Tokens (Single Source of Truth)", () => {
  describe("Brand shorthand tokens", () => {
    it("should provide brand.navy as a string hex value", () => {
      expect(typeof brand.navy).toBe("string");
      expect(brand.navy).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(brand.navy).toBe("#0A1B39");
    });

    it("should provide brand.teal as a string hex value", () => {
      expect(typeof brand.teal).toBe("string");
      expect(brand.teal).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(brand.teal).toBe("#0BA5EC");
    });

    it("should provide primary, dark, and light variants in brand shorthand", () => {
      expect(brand.primary).toBe("#0A65CC");
      expect(brand.navyDark).toBe("#0A1B39");
      expect(brand.navyLight).toBe("#E7F0FA");
      expect(brand.tealAccent).toBe("#14B8A6");
      expect(brand.tealLight).toBe("#E0F2FE");
    });
  });

  describe("Brand Scale Tokens", () => {
    it("should provide full navy scale and semantic aliases", () => {
      expect(brandTokens.navy.DEFAULT).toBe("#0A1B39");
      expect(brandTokens.navy.primary).toBe("#0A65CC");
      expect(brandTokens.navy.hover).toBe("#084E9E");
      expect(brandTokens.navy.light).toBe("#E7F0FA");
      expect(brandTokens.navy[500]).toBe("#0A65CC");
      expect(brandTokens.navy[800]).toBe("#0A1B39");
    });

    it("should provide full teal scale and semantic aliases", () => {
      expect(brandTokens.teal.DEFAULT).toBe("#0BA5EC");
      expect(brandTokens.teal.accent).toBe("#14B8A6");
      expect(brandTokens.teal.light).toBe("#E0F2FE");
      expect(brandTokens.teal[500]).toBe("#0BA5EC");
    });
  });

  describe("Gray & Neutral Tokens", () => {
    it("should contain standard 50-900 gray palette matching Figma", () => {
      expect(grayTokens[50]).toBe("#F7F7F8");
      expect(grayTokens[100]).toBe("#F1F2F4");
      expect(grayTokens[200]).toBe("#E4E5E8");
      expect(grayTokens[900]).toBe("#18191C");
    });
  });

  describe("Semantic & Badge Tokens", () => {
    it("should contain success, warning, danger, and info", () => {
      expect(semanticTokens.success.DEFAULT).toBe("#12B76A");
      expect(semanticTokens.warning.DEFAULT).toBe("#F79009");
      expect(semanticTokens.danger.DEFAULT).toBe("#F04438");
      expect(semanticTokens.info.DEFAULT).toBe("#0BA5EC");
      expect(semanticTokens.star).toBe("#FCAB28");
    });

    it("should define badge tokens for fulltime, contract, internship, and featured", () => {
      expect(badgeTokens.fulltime.bg).toBe("#E7F0FA");
      expect(badgeTokens.fulltime.text).toBe("#0A65CC");
      expect(badgeTokens.contract.bg).toBe("#E7F6EC");
      expect(badgeTokens.contract.text).toBe("#12B76A");
      expect(badgeTokens.internship.bg).toBe("#FFF6E6");
      expect(badgeTokens.internship.text).toBe("#F79009");
      expect(badgeTokens.featured.bg).toBe("#FFEAE4");
      expect(badgeTokens.featured.text).toBe("#E05735");
    });
  });

  describe("Unified designTokens container", () => {
    it("should expose all token groups together", () => {
      expect(designTokens.brand).toBe(brandTokens);
      expect(designTokens.gray).toBe(grayTokens);
      expect(designTokens.semantic).toBe(semanticTokens);
      expect(designTokens.badges).toBe(badgeTokens);
      expect(designTokens.shorthand).toBe(brand);
    });
  });
});

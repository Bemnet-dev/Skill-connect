/**
 * @jest-environment node
 */
import { describe, it, expect } from "@jest/globals";
import { queryKeys } from "@/state/query/queryKeys";

describe("queryKeys (Shared Cache Key Factory)", () => {
  describe("Hierarchical Prefix Integrity", () => {
    it("workers hierarchy follows all -> details -> detail -> subresources", () => {
      const all = queryKeys.workers.all;
      const details = queryKeys.workers.details();
      const detail = queryKeys.workers.detail("worker-123");
      const reviews = queryKeys.workers.reviews("worker-123", 2);

      expect(details[0]).toBe(all[0]);
      expect(detail.slice(0, 2)).toEqual(details);
      expect(detail[2]).toBe("worker-123");
      expect(reviews.slice(0, 3)).toEqual(detail);
      expect(reviews[3]).toBe("reviews");
    });

    it("bookings hierarchy follows all -> lists -> filtered / customer list", () => {
      const all = queryKeys.bookings.all;
      const lists = queryKeys.bookings.lists();
      const customerList = queryKeys.bookings.customerList("cust-456", {
        status: "pending",
      });

      expect(lists[0]).toBe(all[0]);
      expect(customerList.slice(0, 2)).toEqual(lists);
      expect(customerList[2]).toBe("customer");
      expect(customerList[3]).toBe("cust-456");
    });

    it("chat hierarchy follows all -> thread -> messages", () => {
      const all = queryKeys.chat.all;
      const thread = queryKeys.chat.thread("thread-789");
      const messages = queryKeys.chat.messages("thread-789", 1);

      expect(thread[0]).toBe(all[0]);
      expect(thread[1]).toBe("thread");
      expect(thread[2]).toBe("thread-789");
      expect(messages.slice(0, 3)).toEqual(thread);
      expect(messages[3]).toBe("messages");
    });
  });

  describe("Domain Key Coverage", () => {
    it("generates correct auth query keys", () => {
      expect(queryKeys.auth.all).toEqual(["auth"]);
      expect(queryKeys.auth.me()).toEqual(["auth", "me"]);
      expect(queryKeys.auth.session()).toEqual(["auth", "session"]);
    });

    it("generates correct discovery query keys", () => {
      expect(queryKeys.discovery.all).toEqual(["discovery"]);
      expect(queryKeys.discovery.search({ q: "plumber", city: "NYC" })).toEqual([
        "discovery",
        "search",
        { q: "plumber", city: "NYC" },
      ]);
      expect(queryKeys.discovery.popularCategories()).toEqual([
        "discovery",
        "popular-categories",
      ]);
      expect(queryKeys.discovery.featuredWorkers()).toEqual([
        "discovery",
        "featured-workers",
      ]);
      expect(
        queryKeys.discovery.nearbyWorkers({ latitude: 10, longitude: 20 })
      ).toEqual(["discovery", "nearby", { latitude: 10, longitude: 20 }]);
    });

    it("generates correct quotations query keys", () => {
      expect(queryKeys.quotations.all).toEqual(["quotations"]);
      expect(queryKeys.quotations.byBooking("b-100")).toEqual([
        "quotations",
        "booking",
        "b-100",
      ]);
      expect(queryKeys.quotations.detail("q-200")).toEqual([
        "quotations",
        "detail",
        "q-200",
      ]);
      expect(queryKeys.quotations.workerPendingQuotes("w-50")).toEqual([
        "quotations",
        "worker",
        "w-50",
        "pending",
      ]);
    });

    it("generates correct payments query keys", () => {
      expect(queryKeys.payments.all).toEqual(["payments"]);
      expect(queryKeys.payments.earnings("w-1", "month")).toEqual([
        "payments",
        "earnings",
        "w-1",
        "month",
      ]);
      expect(queryKeys.payments.history("u-2", 1)).toEqual([
        "payments",
        "history",
        "u-2",
        { page: 1 },
      ]);
      expect(queryKeys.payments.invoices("b-3")).toEqual([
        "payments",
        "invoices",
        "b-3",
      ]);
      expect(queryKeys.payments.payoutMethods("w-1")).toEqual([
        "payments",
        "payout-methods",
        "w-1",
      ]);
    });

    it("generates correct ratings query keys", () => {
      expect(queryKeys.ratings.all).toEqual(["ratings"]);
      expect(queryKeys.ratings.summary("w-99")).toEqual([
        "ratings",
        "summary",
        "w-99",
      ]);
      expect(queryKeys.ratings.byBooking("b-88")).toEqual([
        "ratings",
        "booking",
        "b-88",
      ]);
    });

    it("generates correct admin query keys", () => {
      expect(queryKeys.admin.all).toEqual(["admin"]);
      expect(
        queryKeys.admin.verificationQueue({ status: "pending", page: 1 })
      ).toEqual(["admin", "verification-queue", { status: "pending", page: 1 }]);
      expect(queryKeys.admin.disputes({ resolved: false })).toEqual([
        "admin",
        "disputes",
        { resolved: false },
      ]);
      expect(queryKeys.admin.disputeDetail("disp-12")).toEqual([
        "admin",
        "dispute",
        "disp-12",
      ]);
      expect(queryKeys.admin.stats()).toEqual(["admin", "stats"]);
    });

    it("generates correct notifications query keys", () => {
      expect(queryKeys.notifications.all).toEqual(["notifications"]);
      expect(queryKeys.notifications.list(2)).toEqual([
        "notifications",
        "list",
        { page: 2 },
      ]);
      expect(queryKeys.notifications.unreadCount()).toEqual([
        "notifications",
        "unread-count",
      ]);
    });
  });
});

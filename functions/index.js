const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { getFirestore } = require("firebase-admin/firestore");
const { initializeApp } = require("firebase-admin/app");
const { format, startOfWeek } = require("date-fns");

initializeApp();

/**
 * Callable Cloud Function: check-in members for today.
 * Ensures at most one attendance record per member per day (idempotent).
 * Only creates a new doc when none exists for (memberId, today).
 *
 * @param {Object} data - { memberIds: string[] }
 * @returns {{ checkedIn: string[], alreadyCheckedIn: string[] }}
 */
exports.checkIn = onCall(
  { enforceAppCheck: false },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be signed in to check in.");
    }

    const { memberIds } = request.data || {};
    if (!Array.isArray(memberIds) || memberIds.length === 0) {
      throw new HttpsError("invalid-argument", "memberIds must be a non-empty array.");
    }

    const db = getFirestore();
    const now = new Date();
    const today = format(now, "yyyy-MM-dd");
    const weekStart = format(startOfWeek(now), "yyyy-MM-dd");
    const timestamp = now.toISOString();

    const attendanceRef = db.collection("attendance");
    const checkedIn = [];
    const alreadyCheckedIn = [];

    for (const memberId of memberIds) {
      if (typeof memberId !== "string" || !memberId.trim()) continue;

      const existing = await attendanceRef
        .where("memberId", "==", memberId)
        .where("date", "==", today)
        .limit(1)
        .get();

      if (existing.empty) {
        await attendanceRef.add({
          memberId,
          date: today,
          weekStart,
          timestamp,
        });
        checkedIn.push(memberId);
      } else {
        alreadyCheckedIn.push(memberId);
      }
    }

    return { checkedIn, alreadyCheckedIn };
  }
);

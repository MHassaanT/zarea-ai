import { doc, getDoc, Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export interface SubscriptionCheckResult {
  allowed: boolean;
  reason?: "not_logged_in" | "no_user_doc" | "trial_expired";
}

export const checkSubscription = async (): Promise<SubscriptionCheckResult> => {
  const user = auth.currentUser;
  if (!user) return { allowed: false, reason: "not_logged_in" };

  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) return { allowed: false, reason: "no_user_doc" };

  const data = snap.data();
  const isSubscribed = Boolean(data.isSubscribed);

  let trialEndDate: Date;
  if (data.trialEndsAt instanceof Timestamp) {
    trialEndDate = data.trialEndsAt.toDate();
  } else {
    trialEndDate = new Date(data.trialEndsAt);
  }

  const now = new Date();

  if (!isSubscribed && now > trialEndDate) {
    return { allowed: false, reason: "trial_expired" };
  }

  return { allowed: true };
};

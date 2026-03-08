// ============================================================
//  LYFA – EmailJS Service
// ============================================================

import emailjs from "@emailjs/browser";

const EMAILJS_SERVICE_ID  = "service_lyfa";
const EMAILJS_TEMPLATE_ID = "template_hq0pamb";
const EMAILJS_PUBLIC_KEY  = "YnX5AKdeJi6jZsdKx";

const APP_URL = "https://lyfa-3a112.web.app";

export async function sendSOSEmail(caregivers, elderName, uid, alertId) {
  if (!caregivers || caregivers.length === 0) return { success: false, error: "No caregivers" };

  const alertTime = new Date().toLocaleString("en-IN", { dateStyle: "full", timeStyle: "short" });

  const results = await Promise.allSettled(
    caregivers.map((cg) => {
      const ackLink = `${APP_URL}/ack.html?uid=${uid}&alertId=${alertId}&name=${encodeURIComponent(cg.name)}`;

      return emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          to_email:           cg.email,
          to_name:            cg.name,
          caregiver_relation: cg.relation || "Caregiver",
          elder_name:         elderName,
          alert_time:         alertTime,
          ack_link:           ackLink,
          respond_url:        ackLink,
          message: `🚨 EMERGENCY: ${elderName} needs immediate help! Click the button below to confirm you have seen this alert.`,
        },
        EMAILJS_PUBLIC_KEY
      );
    })
  );

  const sent   = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;
  return { success: sent > 0, sent, failed };
}

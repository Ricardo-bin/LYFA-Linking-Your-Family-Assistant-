// ============================================================
//  LYFA – EmailJS Service
// ============================================================

import emailjs from "@emailjs/browser";

const EMAILJS_SERVICE_ID  = "service_lyfa";
const EMAILJS_TEMPLATE_ID = "template_hq0pamb";
const EMAILJS_PUBLIC_KEY  = "YnX5AKdeJi6jZsdKx";

export async function sendSOSEmail(caregivers, elderName, respondUrl) {
  if (!caregivers || caregivers.length === 0) return { success: false, error: "No caregivers" };

  const alertTime = new Date().toLocaleString("en-IN", { dateStyle: "full", timeStyle: "short" });

  const results = await Promise.allSettled(
    caregivers.map((cg) =>
      emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          to_email:           cg.email,
          to_name:            cg.name,
          caregiver_relation: cg.relation || "Caregiver",
          elder_name:         elderName,
          alert_time:         alertTime,
          respond_url:        respondUrl,
          // Plain text version - Gmail cannot block plain text URLs
          respond_url_text:   respondUrl,
          message: `🚨 EMERGENCY ALERT: ${elderName} has pressed the SOS button and needs immediate assistance. Please check on them right away or call emergency services.`,
        },
        EMAILJS_PUBLIC_KEY
      )
    )
  );

  const sent   = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;
  return { success: sent > 0, sent, failed };
}

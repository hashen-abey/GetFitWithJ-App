// Supabase Edge Function: session-reminders
// Schedule with pg_cron or Supabase cron:
//   select cron.schedule('hourly-reminders', '0 * * * *', $$select net.http_post(...)$$);

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "noreply@getfitwithj.com";
const APP_URL = Deno.env.get("NEXT_PUBLIC_APP_URL") || "https://getfitwithj.vercel.app";

Deno.serve(async (req) => {
  try {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in1h = new Date(now.getTime() + 60 * 60 * 1000);

    // Build datetime strings for matching
    const in24hDate = in24h.toISOString().split("T")[0];
    const in24hTime = in24h.toTimeString().slice(0, 5);
    const in1hDate = in1h.toISOString().split("T")[0];
    const in1hTime = in1h.toTimeString().slice(0, 5);

    // Find sessions starting in ~24 hours
    const { data: sessions24h } = await supabase
      .from("sessions")
      .select(`
        id, title, session_date, start_time, type, location_or_link, duration_mins,
        profiles!sessions_client_id_fkey(id, full_name, email)
      `)
      .eq("session_date", in24hDate)
      .eq("start_time", in24hTime + ":00")
      .eq("status", "scheduled");

    // Find sessions starting in ~1 hour
    const { data: sessions1h } = await supabase
      .from("sessions")
      .select(`
        id, title, session_date, start_time, type, location_or_link, duration_mins,
        profiles!sessions_client_id_fkey(id, full_name, email)
      `)
      .eq("session_date", in1hDate)
      .eq("start_time", in1hTime + ":00")
      .eq("status", "scheduled");

    const results = { sent24h: 0, sent1h: 0, errors: 0 };

    async function sendReminder(session: any, hours: number) {
      const client = session.profiles;
      if (!client?.email) return;

      const sessionDateTime = new Date(`${session.session_date}T${session.start_time}`);
      const formattedDate = sessionDateTime.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      });
      const formattedTime = sessionDateTime.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

      const subject = hours === 24
        ? `Reminder: Your session "${session.title}" is tomorrow`
        : `Your session "${session.title}" starts in 1 hour`;

      const joinInfo = session.type === "online" && session.location_or_link
        ? `<p><a href="${session.location_or_link}" style="color:#3b82f6">Join Meeting →</a></p>`
        : session.location_or_link
        ? `<p>📍 ${session.location_or_link}</p>`
        : "";

      const html = `
        <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <div style="background:#3b82f6;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px">
            <h1 style="color:white;margin:0;font-size:20px">⚡ GetFitWithJ</h1>
          </div>
          <h2 style="color:#1e293b">Hi ${client.full_name}!</h2>
          <p style="color:#475569">This is a reminder for your upcoming session:</p>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:16px 0">
            <h3 style="color:#1e293b;margin:0 0 8px">${session.title}</h3>
            <p style="color:#64748b;margin:4px 0">📅 ${formattedDate}</p>
            <p style="color:#64748b;margin:4px 0">🕐 ${formattedTime}</p>
            <p style="color:#64748b;margin:4px 0">${session.type === "online" ? "💻 Online" : "🏋️ In Person"}</p>
            ${joinInfo}
          </div>
          <p style="color:#94a3b8;font-size:13px">View your dashboard: <a href="${APP_URL}/my-dashboard" style="color:#3b82f6">${APP_URL}/my-dashboard</a></p>
        </div>
      `;

      const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: client.email,
        subject,
        html,
      });

      if (error) {
        console.error("Email send error:", error);
        results.errors++;
      }

      // Create notification in DB
      await supabase.from("notifications").insert({
        user_id: client.id,
        type: hours === 24 ? "session_reminder_24h" : "session_reminder_1h",
        payload: { session_id: session.id, session_date: session.session_date },
      });
    }

    // Send 24h reminders
    for (const session of sessions24h || []) {
      await sendReminder(session, 24);
      results.sent24h++;
    }

    // Send 1h reminders
    for (const session of sessions1h || []) {
      await sendReminder(session, 1);
      results.sent1h++;
    }

    return new Response(
      JSON.stringify({ success: true, ...results }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

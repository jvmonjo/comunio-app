import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"
import { Resend } from "https://esm.sh/resend@3.2.0"

const resend = new Resend(Deno.env.get("RESEND_API_KEY"))
const supabaseUrl = Deno.env.get("SUPABASE_URL")!
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

serve(async (req) => {
  try {
    const payload = await req.json()
    const { table, type, record, old_record } = payload

    if (table !== "gifts") {
      return new Response(JSON.stringify({ message: "Ignored table" }), { status: 200 })
    }

    // Fetch all admins' emails
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    if (usersError) throw usersError

    const adminEmails = users.users
      .filter((u) => u.email)
      .map((u) => u.email!)

    if (adminEmails.length === 0) {
      return new Response(JSON.stringify({ message: "No admins found" }), { status: 200 })
    }

    let subject = ""
    let html = ""
    let toEmails: string[] = []

    if (type === "INSERT") {
      // New gift added
      const creatorEmail = users.users.find(u => u.id === record.created_by)?.email
      toEmails = adminEmails.filter(email => email !== creatorEmail)
      
      if (toEmails.length === 0) {
        return new Response(JSON.stringify({ message: "No other admins to notify" }), { status: 200 })
      }

      subject = `🎁 Nou regal afegit: ${record.name}`
      html = `
        <h1>S'ha afegit un nou regal</h1>
        <p><strong>Nom:</strong> ${record.name}</p>
        <p><strong>Descripció:</strong> ${record.description}</p>
        <p><strong>Preu:</strong> ${record.price ? `${record.price}€` : 'No indicat'}</p>
        <p>L'ha afegit: ${creatorEmail || 'Administrador'}</p>
        <br>
        <p><a href="${Deno.env.get("SITE_URL") || '#'}/admin">Vore al panell d'admin</a></p>
      `
    } else if (type === "UPDATE") {
      // Check if gift was reserved (assigned_to changed from null to something)
      const wasReserved = !old_record.assigned_to && record.assigned_to
      
      if (!wasReserved) {
        return new Response(JSON.stringify({ message: "Not a reservation update" }), { status: 200 })
      }

      toEmails = adminEmails
      subject = `✅ Regal reservat: ${record.name}`
      html = `
        <h1>S'ha reservat un regal!</h1>
        <p><strong>Regal:</strong> ${record.name}</p>
        <p><strong>Reservat per:</strong> ${record.assigned_to}</p>
        ${record.guest_message ? `<p><strong>Missatge:</strong> "${record.guest_message}"</p>` : ''}
        <br>
        <p><a href="${Deno.env.get("SITE_URL") || '#'}/admin">Vore al panell d'admin</a></p>
      `
    } else {
      return new Response(JSON.stringify({ message: "Event type not handled" }), { status: 200 })
    }

    if (toEmails.length > 0) {
      const { data, error } = await resend.emails.send({
        from: Deno.env.get("RESEND_FROM_EMAIL") || "onboarding@resend.dev",
        to: toEmails,
        subject: subject,
        html: html,
      })

      if (error) throw error
      return new Response(JSON.stringify({ message: "Emails sent", data }), { status: 200 })
    }

    return new Response(JSON.stringify({ message: "Nothing to do" }), { status: 200 })

  } catch (error) {
    console.error("Error handling notification:", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})

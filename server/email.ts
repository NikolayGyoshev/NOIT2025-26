import nodemailer from "nodemailer";

// For development, use a test email service (Mailtrap, etc.)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "localhost",
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: process.env.EMAIL_SECURE === "true",
  auth: process.env.EMAIL_USER ? {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  } : undefined,
});

export async function sendReservationConfirmation(
  email: string,
  firstName: string,
  roomTitle: string,
  startDate: Date,
  endDate: Date,
  totalPrice: number
) {
  const formattedStart = startDate.toLocaleDateString("bg-BG");
  const formattedEnd = endDate.toLocaleDateString("bg-BG");

  const mailOptions = {
    from: process.env.EMAIL_FROM || "noreply@noshuvki-plus.bg",
    to: email,
    subject: "Стаята Ви е потвърдена",
    html: `
      <h2>Стаята Ви е потвърдена!</h2>
      <p>Здравей ${firstName},</p>
      <p>Вашата резервация е успешно обработена.</p>
      <h3>Детали на резервацията:</h3>
      <ul>
        <li><strong>Стая:</strong> ${roomTitle}</li>
        <li><strong>Вход:</strong> ${formattedStart}</li>
        <li><strong>Изход:</strong> ${formattedEnd}</li>
        <li><strong>Общо цена:</strong> ${(totalPrice / 100).toFixed(2)} лв.</li>
      </ul>
      <p>Благодарим че избрахте нас!</p>
      <p>Нощувки+ Team</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[email] Reservation confirmation sent to ${email}`);
  } catch (error) {
    console.error(`[email] Failed to send email to ${email}:`, error);
    // In dev, don't fail the reservation if email fails
    if (process.env.NODE_ENV === "production") {
      throw error;
    }
  }
}

export async function sendContactReply(
  email: string,
  name: string,
  subject: string,
  originalMessage: string,
  replyMessage: string
) {
  const mailOptions = {
    from: process.env.EMAIL_FROM || "noreply@noshuvki-plus.bg",
    to: email,
    subject: `Отговор: ${subject}`,
    html: `
      <h2>Отговор на вашето запитване</h2>
      <p>Здравей ${name},</p>
      <p>Благодарим за съобщението Ви. Ето нашия отговор:</p>
      <blockquote style="border-left: 3px solid #e5e7eb; padding-left: 12px; margin: 12px 0;">
        ${replyMessage}
      </blockquote>
      <h3>Вашето съобщение:</h3>
      <blockquote style="border-left: 3px solid #e5e7eb; padding-left: 12px; margin: 12px 0;">
        ${originalMessage}
      </blockquote>
      <p>Нощувки+ Team</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[email] Contact reply sent to ${email}`);
  } catch (error) {
    console.error(`[email] Failed to send contact reply to ${email}:`, error);
    if (process.env.NODE_ENV === "production") {
      throw error;
    }
  }
}

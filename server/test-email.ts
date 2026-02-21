import { sendReservationConfirmation } from "./email";

async function main() {
  await sendReservationConfirmation(
    process.env.TEST_EMAIL || "your@email.com",
    "Тест",
    "Тестова стая",
    new Date(),
    new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    12345
  );
  console.log("Test email sent (if SMTP is configured correctly)");
}

main().catch(console.error);

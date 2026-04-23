import { getMailFromAddress, getResendApiKey } from "@/lib/config";

type SendPlatformEmailInput = {
  to: string;
  subject: string;
  text: string;
};

export async function sendPlatformEmail(input: SendPlatformEmailInput) {
  const resendApiKey = getResendApiKey();

  if (!resendApiKey) {
    console.info("[orbit-email:fallback]", {
      from: getMailFromAddress(),
      ...input
    });
    return {
      delivered: false,
      fallback: true
    } as const;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: getMailFromAddress(),
      to: input.to,
      subject: input.subject,
      text: input.text
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Email delivery failed: ${response.status} ${errorText}`);
  }

  return {
    delivered: true,
    fallback: false
  } as const;
}


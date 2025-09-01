export async function sendPasswordResetLinkEmail(email: string, resetLink: string) {
  // This is a placeholder for a real email sending service (e.g., SendGrid, Mailgun).
  // In a real application, you would use an email library to send an HTML email.

  console.log('--- --- ---');
  console.log('--- --- ---');
  console.log('--- --- ---');
  console.log('SENDING EMAIL TO:', email);
  console.log('Subject: Reset your password');
  console.log('Body:');
  console.log('Click the link below to reset your password:');
  console.log(resetLink);
  console.log('This link will expire in 1 hour.');
  console.log('--- --- ---');
  console.log('--- --- ---');
  console.log('--- --- ---');

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  return { success: true };
}

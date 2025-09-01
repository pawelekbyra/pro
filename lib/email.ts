export async function sendLoginDetailsEmail(email: string, password_DO_NOT_USE_IN_PRODUCTION: string) {
  // This is a placeholder for a real email sending service (e.g., SendGrid, Mailgun).
  // In a real application, you would use an email library to send an HTML email.
  // IMPORTANT: Sending passwords in plaintext is insecure. This is for demonstration purposes only.
  // A better approach is to send a password reset link.

  console.log('--- --- ---');
  console.log('--- --- ---');
  console.log('--- --- ---');
  console.log('SENDING EMAIL TO:', email);
  console.log('Subject: Your new account details');
  console.log('Body:');
  console.log(`Welcome! Your account has been created.`);
  console.log(`You can log in with your email and the following password:`);
  console.log(`Password: ${password_DO_NOT_USE_IN_PRODUCTION}`);
  console.log('--- --- ---');
  console.log('--- --- ---');
  console.log('--- --- ---');

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  return { success: true };
}

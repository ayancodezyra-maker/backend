/* CURSOR PATCH START */
export const verificationEmailHTML = (fullName, verifyUrl) => `
<html>
<body style="font-family: Arial; background:#f5f5f5; padding:20px;">
  <div style="max-width:600px; margin:auto; background:white; padding:30px; border-radius:10px;">
    <h2 style="color:#333;">Verify your BidRoom account</h2>
    <p>Hello ${fullName || "there"},</p>
    <p>Please verify your email by clicking the button below:</p>

    <a href="${verifyUrl}" 
       style="display:inline-block; background:#4f46e5; color:white; padding:12px 20px;
       border-radius:6px; text-decoration:none; margin-top:20px;">
       Verify Email
    </a>

    <p style="margin-top:20px; color:#555;">
      Or open this link:<br>
      ${verifyUrl}
    </p>

    <p style="margin-top:20px; font-size:12px; color:#888;">
      This link expires in 30 minutes.
    </p>
  </div>
</body>
</html>
`;
/* CURSOR PATCH END */


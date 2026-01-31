const SibApiV3Sdk = require('sib-api-v3-sdk');

const defaultClient = SibApiV3Sdk.ApiClient.instance;

// Configure API key authorization: api-key
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

const sendWelcomeEmail = async (email, name) => {
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

  sendSmtpEmail.subject = "Welcome to Smart Bio GPT! 🧬";
  sendSmtpEmail.sender = { "name": "Smart Bio GPT Team", "email": process.env.ADMIN_EMAIL };
  sendSmtpEmail.to = [{ "email": email, "name": name }];

  // Modern, Premium HTML Template
  sendSmtpEmail.htmlContent = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;500;700&family=Dancing+Script:wght@700&display=swap');
  
  body {
    font-family: 'Outfit', sans-serif;
    margin: 0;
    padding: 0;
    background-color: #f8fafc;
    color: #1e293b;
  }
  .container {
    max-width: 600px;
    margin: 40px auto;
    background: #ffffff;
    border-radius: 24px;
    overflow: hidden;
    box-shadow: 0 20px 40px rgba(0,0,0,0.05);
    border: 1px solid #e2e8f0;
  }
  .header {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    padding: 60px 20px;
    text-align: center;
    position: relative;
    overflow: hidden;
  }
  .header::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%);
    animation: pulse 4s infinite;
  }
  @keyframes pulse {
    0% { transform: scale(1); opacity: 0.5; }
    50% { transform: scale(1.1); opacity: 0.8; }
    100% { transform: scale(1); opacity: 0.5; }
  }
  .logo-text {
    font-size: 32px;
    font-weight: 700;
    color: white;
    z-index: 10;
    position: relative;
    letter-spacing: -0.5px;
  }
  .content {
    padding: 40px;
    text-align: center;
  }
  h1 {
    font-size: 28px;
    color: #0f172a;
    margin-bottom: 16px;
    font-weight: 700;
  }
  p {
    font-size: 16px;
    line-height: 1.6;
    color: #64748b;
    margin-bottom: 24px;
  }
  .btn {
    display: inline-block;
    padding: 16px 32px;
    background-color: #10b981;
    color: white;
    text-decoration: none;
    border-radius: 50px;
    font-weight: 600;
    margin-top: 10px;
    transition: all 0.3s ease;
    box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2);
  }
  .btn:hover {
    background-color: #059669;
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.3);
  }
  .feature-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin: 30px 0;
  }
  .feature {
    background: #f1f5f9;
    padding: 15px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 500;
    color: #334155;
  }
  .signature {
    margin-top: 50px;
    text-align: right;
    border-top: 1px solid #f1f5f9;
    padding-top: 20px;
  }
  .dev-signature {
    font-family: 'Dancing Script', cursive;
    font-size: 24px;
    color: #10b981;
  }
  .footer {
    background-color: #f1f5f9;
    padding: 20px;
    text-align: center;
    font-size: 12px;
    color: #94a3b8;
  }
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-text">Smart Bio GPT 🧬</div>
    </div>
    <div class="content">
      <h1>Hello, ${name}! 👋</h1>
      <p>
        Thanks for signing up for <strong>Smart Bio GPT</strong>! You are now part of a community revolutionizing biological research with AI.
      </p>
      
      <p>Start exploring protein structures, analyzing genetic data, and getting real-time AI insights.</p>

      <div class="feature-grid">
        <div class="feature">✨ 3D Protein Analysis</div>
        <div class="feature">🧬 Gene Mapping</div>
        <div class="feature">🤖 AI Chat Assistant</div>
        <div class="feature">📊 Real-time Data</div>
      </div>

      <a href="http://localhost:5173/dashboard" class="btn">Explore Now</a>

      <div class="signature">
        <p style="margin-bottom: 5px; font-size: 14px;">With innovation,</p>
        <div class="dev-signature">Developed by Saiprasad</div>
      </div>
    </div>
    <div class="footer">
      © 2026 Smart Bio GPT. All rights reserved.
    </div>
  </div>
</body>
</html>
    `;

  try {
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('API called successfully. Returned data: ' + JSON.stringify(data));
    return { success: true, data };
  } catch (error) {
    console.error('Email API Error:', error);
    return { success: false, error };
  }
};

module.exports = { sendWelcomeEmail };

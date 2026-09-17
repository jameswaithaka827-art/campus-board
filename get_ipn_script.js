async function registerAndGetIpnId() {
  console.log("1. Authenticating with Pesapal Live API...");
  const authRes = await fetch("https://pay.pesapal.com/v3/api/Auth/RequestToken", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      consumer_key: "XCz0zSHVgY9WUcIvKczcnPXT2TDtE+UJ",
      consumer_secret: "BOZ6N/SnX3Cb2CIGhnh/5bXij2Q="
    }),
  });
  
  const authData = await authRes.json();
  const token = authData.token;

  if (!token) {
    console.error("Authentication failed:", authData);
    return;
  }
  console.log("Authentication successful!");

  console.log("2. Registering IPN URL programmatically...");
  const regRes = await fetch("https://pay.pesapal.com/v3/api/URLSetup/RegisterIPN", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify({
      url: "https://compass-mind.vercel.app/api/payments/pesapal/ipn",
      ipn_notification_type: "POST"
    }),
  });

  const regData = await regRes.json();
  console.log("\n=== REGISTRATION RESULT ===");
  console.log(JSON.stringify(regData, null, 2));
}

registerAndGetIpnId();
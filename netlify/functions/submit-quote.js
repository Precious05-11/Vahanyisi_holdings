exports.handler = async function (event) {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method not allowed" }),
    };
  }

  try {
    // Get the form data sent from the website
    const data = JSON.parse(event.body);

    const { name, phone, email, service, date, budget, location, details } =
      data;

    // HubSpot token stored securely in Netlify
    const HUBSPOT_ACCESS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;

    if (!HUBSPOT_ACCESS_TOKEN) {
      throw new Error("HubSpot access token is missing");
    }

    // Create a contact in HubSpot
    const contactResponse = await fetch(
      "https://api.hubapi.com/crm/v3/objects/contacts",
      {
        method: "POST",

        headers: {
          Authorization: `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          properties: {
            firstname: name,
            email: email,
            phone: phone,
          },
        }),
      },
    );

    const contactData = await contactResponse.json();

    if (!contactResponse.ok) {
      console.error("HubSpot contact error:", contactData);

      return {
        statusCode: contactResponse.status,
        body: JSON.stringify({
          success: false,
          message: "Unable to create contact",
        }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Quote request received",
        contactId: contactData.id,
      }),
    };
  } catch (error) {
    console.error("Function error:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: "Something went wrong",
      }),
    };
  }
};

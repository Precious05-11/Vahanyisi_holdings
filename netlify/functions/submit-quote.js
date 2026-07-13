exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method not allowed" }),
    };
  }

  try {
    const data = JSON.parse(event.body);

    const { name, phone, email, service, date, budget, location, details } =
      data;

    const HUBSPOT_ACCESS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;

    if (!HUBSPOT_ACCESS_TOKEN) {
      throw new Error("HubSpot access token is missing");
    }

    const headers = {
      Authorization: `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    };

    // 1. Create the contact
    const contactResponse = await fetch(
      "https://api.hubapi.com/crm/v3/objects/contacts",
      {
        method: "POST",
        headers,
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
          error: contactData,
        }),
      };
    }

    // 2. Create the deal with the custom properties
    const dealResponse = await fetch(
      "https://api.hubapi.com/crm/v3/objects/deals",
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          properties: {
            dealname: `${name} - ${service} Quote Request`,
            pipeline: "default",
            dealstage: "appointmentscheduled",

            service_needed: service,
            event_project_date: date || null,
            estimated_budget: budget || "",
            location__venue: location || "",
            project_details: details || "",
          },
        }),
      },
    );

    const dealData = await dealResponse.json();

    if (!dealResponse.ok) {
      console.error("HubSpot deal error:", dealData);

      return {
        statusCode: dealResponse.status,
        body: JSON.stringify({
          success: false,
          message: "Contact created, but deal could not be created",
          error: dealData,
        }),
      };
    }

    // 3. Associate the deal with the contact
    const associationResponse = await fetch(
      `https://api.hubapi.com/crm/v4/objects/deals/${dealData.id}/associations/contacts/${contactData.id}`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify([
          {
            associationCategory: "HUBSPOT_DEFINED",
            associationTypeId: 3,
          },
        ]),
      },
    );

    if (!associationResponse.ok) {
      const associationError = await associationResponse.json();

      console.error("Association error:", associationError);

      return {
        statusCode: associationResponse.status,
        body: JSON.stringify({
          success: false,
          message: "Contact and deal created, but association failed",
          error: associationError,
        }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Quote request successfully added to CRM",
        contactId: contactData.id,
        dealId: dealData.id,
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

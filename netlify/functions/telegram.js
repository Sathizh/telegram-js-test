const NITHRA_API_URL =
    "https://app.nithramatrimony.net/api/getfullview";

// ============================================================
// NETLIFY FUNCTION
// ============================================================

exports.handler = async (event) => {
    try {
        console.log("\n======================================");
        console.log("📩 Telegram request received");
        console.log("======================================");

        // Only accept POST
        if (event.httpMethod !== "POST") {
            return {
                statusCode: 405,
                body: JSON.stringify({
                    ok: false,
                    error: "Method not allowed",
                }),
            };
        }

        const update = JSON.parse(event.body || "{}");

        const message = update.message;

        // Ignore updates that don't contain a message
        if (!message) {
            console.log("ℹ️ No message in update");

            return {
                statusCode: 200,
                body: JSON.stringify({
                    ok: true,
                }),
            };
        }

        const chatId = message.chat.id;

        const givenId =
            (message.text || "").trim();

        console.log("Chat ID:", chatId);
        console.log("Profile ID:", givenId);


        // ====================================================
        // VALIDATE PROFILE ID
        // ====================================================

        if (!givenId) {

            await sendTelegramMessage(
                chatId,
                "தயவுசெய்து Profile ID அனுப்பவும்."
            );

            return {
                statusCode: 200,
                body: JSON.stringify({
                    ok: true,
                }),
            };
        }


        if (!/^\d+$/.test(givenId)) {

            await sendTelegramMessage(
                chatId,
                "❌ சரியான Profile ID-ஐ மட்டும் அனுப்பவும்."
            );

            return {
                statusCode: 200,
                body: JSON.stringify({
                    ok: true,
                }),
            };
        }


        // ====================================================
        // GET NITHRA API TOKEN
        // ====================================================

        const bearerToken =
            process.env.API_BEARER_TOKEN;

        if (!bearerToken) {

            console.error(
                "❌ API_BEARER_TOKEN is not configured"
            );

            await sendTelegramMessage(
                chatId,
                "❌ API token is not configured."
            );

            return {
                statusCode: 200,
                body: JSON.stringify({
                    ok: true,
                }),
            };
        }


        // ====================================================
        // CALL NITHRA API
        // ====================================================

        console.log("🔎 Calling Nithra API...");

        const response = await fetch(
            `${NITHRA_API_URL}?lib_v_code=17&langID=en&v_code=4&app_via=Mat_iOS_DYNAMIC`,
            {
                method: "POST",

                headers: {
                    "Accept": "*/*",

                    "Authorization":
                        `Bearer ${bearerToken}`,

                    "Content-Type":
                        "application/json; charset=utf-8",
                },

                body: JSON.stringify({
                    loadId: Number(givenId),
                    searchMobile: givenId,
                }),
            }
        );


        console.log(
            "Nithra API status:",
            response.status
        );


        // ====================================================
        // CHECK HTTP RESPONSE
        // ====================================================

        if (!response.ok) {

            console.error(
                "❌ Nithra API HTTP error:",
                response.status
            );

            await sendTelegramMessage(
                chatId,
                "❌ Profile API request failed."
            );

            return {
                statusCode: 200,
                body: JSON.stringify({
                    ok: true,
                }),
            };
        }


        const result =
            await response.json();


        // ====================================================
        // CHECK PROFILE
        // ====================================================

        if (
            result.status !== 1 ||
            !result.data
        ) {

            console.log(
                "❌ Profile not found"
            );

            await sendTelegramMessage(
                chatId,
                "❌ Profile கிடைக்கவில்லை."
            );

            return {
                statusCode: 200,
                body: JSON.stringify({
                    ok: true,
                }),
            };
        }


        const profile =
            result.data;


        console.log(
            "Profile name:",
            profile.name
        );


        // ====================================================
        // FORMAT PROFILE CAPTION
        // ====================================================

        const caption =
            formatProfileCaption(profile);


        // ====================================================
        // GET VERIFIED PROFILE PHOTO
        // ====================================================

        const profilePhotos =
            getImageUrls(
                profile.verified_photo
            );


        // ====================================================
        // SEND PROFILE PHOTO + CAPTION
        // ====================================================

        if (profilePhotos.length > 0) {

            await sendTelegramPhoto(
                chatId,
                profilePhotos[0],
                caption
            );

            console.log(
                "✅ Profile photo sent"
            );

        } else {

            console.log(
                "⚠️ Verified photo not available"
            );

            await sendTelegramMessage(
                chatId,
                caption
            );
        }


        // ====================================================
        // GET JATHAGAM IMAGE(S)
        // ====================================================

        const jathagamImages =
            getImageUrls(
                profile.v_jathagam
            );


        // ====================================================
        // SEND JATHAGAM AS SEPARATE ALBUM
        // ====================================================

        if (jathagamImages.length > 0) {

            await sendTelegramMediaGroup(
                chatId,
                jathagamImages
            );

            console.log(
                `✅ Sent ${jathagamImages.length} jathagam image(s)`
            );

        } else {

            console.log(
                "ℹ️ No jathagam image available"
            );
        }


        console.log(
            "✅ Complete profile response sent"
        );


        // Telegram only needs HTTP 200
        return {
            statusCode: 200,
            body: JSON.stringify({
                ok: true,
            }),
        };


    } catch (error) {

        console.error(
            "❌ WEBHOOK ERROR:",
            error
        );

        // Return 200 so Telegram doesn't retry
        // the same update.
        return {
            statusCode: 200,
            body: JSON.stringify({
                ok: false,
            }),
        };
    }
};


// ============================================================
// FORMAT PROFILE CAPTION
// ============================================================

function formatProfileCaption(profile) {

    // --------------------------------------------------------
    // BASIC VALUES
    // --------------------------------------------------------

    const name =
        profile.name || "N/A";

    const age =
        profile.age || "N/A";

    const maritalStatus =
        profile.marital_status || "N/A";

    const religion =
        profile.religion_name || "N/A";

    const caste =
        profile.caste || "N/A";

    const motherTongue =
        profile.mother_tongue || "N/A";

    const qualification =
        profile.qualification || "N/A";

    const employedIn =
        profile.employed_in || "N/A";

    const location =
        profile.livingLocationTxt || "N/A";

    const height =
        profile.height || "N/A";

    const weight =
        profile.weight || "N/A";

    const family =
        profile.familyTxt || "N/A";

    const rasi =
        profile.rasi || "N/A";

    const star =
        profile.star || "N/A";

    const havingDosham =
        profile.having_dosham || "N/A";


    // --------------------------------------------------------
    // MARITAL STATUS
    // Only Divorced gets the warning emoji
    // --------------------------------------------------------

    let maritalStatusText =
        maritalStatus;

    if (
        String(maritalStatus)
            .trim()
            .toLowerCase() === "divorced"
    ) {

        maritalStatusText =
            `${maritalStatus} ⚠️`;
    }


    // --------------------------------------------------------
    // DOSHAM
    // No = No 🚫
    // Anything else = Ullathu ✅
    // --------------------------------------------------------

    let doshamText;

    if (
        String(havingDosham)
            .trim()
            .toLowerCase() === "no"
    ) {

        doshamText =
            "No 🚫";

    } else {

        doshamText =
            "Ullathu ✅";
    }


    // --------------------------------------------------------
    // TELEGRAM HTML CAPTION
    // --------------------------------------------------------

    return (
        `👤 <b>${escapeHtml(name)}</b>\n\n` +

        `🎂 <b>வயது:</b> ${escapeHtml(age)}\n` +

        `💍 <b>திருமண நிலை:</b> ${escapeHtml(maritalStatusText)}\n` +

        `🛕 <b>மதம்:</b> ${escapeHtml(religion)}\n` +

        `🧬 <b>சாதி:</b> ${escapeHtml(caste)}\n` +

        `🗣 <b>தாய்மொழி:</b> ${escapeHtml(motherTongue)}\n\n` +

        `🎓 <b>கல்வி:</b> ${escapeHtml(qualification)}\n` +

        `💼 <b>வேலை:</b> ${escapeHtml(employedIn)}\n` +

        `📍 <b>இருப்பிடம்:</b> ${escapeHtml(location)}\n\n` +

        `📏 <b>உயரம்:</b> ${escapeHtml(height)}\n` +

        `⚖️ <b>எடை:</b> ${escapeHtml(weight)}\n` +

        `🏠 <b>குடும்பம்:</b> ${escapeHtml(family)}\n\n` +

        `⭐ <b>ராசி:</b> ${escapeHtml(rasi)}\n` +

        `🌟 <b>நட்சத்திரம்:</b> ${escapeHtml(star)}\n` +

        `🔯 <b>தோஷம்:</b> ${escapeHtml(doshamText)}`
    );
}


// ============================================================
// CONVERT IMAGE VALUE TO ARRAY
// ============================================================

function getImageUrls(value) {

    if (!value) {
        return [];
    }


    // API returns an array
    if (Array.isArray(value)) {

        return value
            .flatMap(item =>
                String(item).split(",")
            )
            .map(url =>
                url.trim()
            )
            .filter(url =>
                url.length > 0
            );
    }


    // API returns comma-separated string
    return String(value)
        .split(",")
        .map(url =>
            url.trim()
        )
        .filter(url =>
            url.length > 0
        );
}


// ============================================================
// SEND TELEGRAM TEXT MESSAGE
// ============================================================

async function sendTelegramMessage(
    chatId,
    text
) {

    const botToken =
        process.env.TELEGRAM_BOT_TOKEN;


    if (!botToken) {

        console.error(
            "❌ TELEGRAM_BOT_TOKEN is not configured"
        );

        return null;
    }


    console.log(
        "📤 Sending Telegram message..."
    );


    const response = await fetch(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
            method: "POST",

            headers: {
                "Content-Type":
                    "application/json",
            },

            body: JSON.stringify({
                chat_id: chatId,

                text: text,

                parse_mode: "HTML",

                disable_web_page_preview: true,
            }),
        }
    );


    const result =
        await response.json();


    console.log(
        "Telegram sendMessage response:",
        JSON.stringify(result)
    );


    return result;
}


// ============================================================
// SEND PROFILE PHOTO + CAPTION
// ============================================================

async function sendTelegramPhoto(
    chatId,
    photoUrl,
    caption
) {

    const botToken =
        process.env.TELEGRAM_BOT_TOKEN;


    if (!botToken) {

        console.error(
            "❌ TELEGRAM_BOT_TOKEN is not configured"
        );

        return null;
    }


    console.log(
        "📤 Sending profile photo..."
    );


    const response = await fetch(
        `https://api.telegram.org/bot${botToken}/sendPhoto`,
        {
            method: "POST",

            headers: {
                "Content-Type":
                    "application/json",
            },

            body: JSON.stringify({
                chat_id: chatId,

                photo: photoUrl,

                caption: caption,

                parse_mode: "HTML",
            }),
        }
    );


    const result =
        await response.json();


    console.log(
        "Telegram sendPhoto response:",
        JSON.stringify(result)
    );


    if (!result.ok) {

        console.error(
            "❌ Telegram rejected profile photo"
        );
    }


    return result;
}


// ============================================================
// SEND JATHAGAM ALBUM
// ============================================================

async function sendTelegramMediaGroup(
    chatId,
    imageUrls
) {

    const botToken =
        process.env.TELEGRAM_BOT_TOKEN;


    if (!botToken) {

        console.error(
            "❌ TELEGRAM_BOT_TOKEN is not configured"
        );

        return null;
    }


    // Telegram allows up to 10 items
    // in one media group.

    const chunks = [];

    for (
        let i = 0;
        i < imageUrls.length;
        i += 10
    ) {

        chunks.push(
            imageUrls.slice(i, i + 10)
        );
    }


    let lastResult = null;


    for (const chunk of chunks) {

        const media =
            chunk.map(url => ({
                type: "photo",
                media: url,
            }));


        console.log(
            `📤 Sending jathagam album: ${media.length} image(s)`
        );


        const response = await fetch(
            `https://api.telegram.org/bot${botToken}/sendMediaGroup`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",
                },

                body: JSON.stringify({
                    chat_id: chatId,

                    media: media,
                }),
            }
        );


        const result =
            await response.json();


        console.log(
            "Telegram sendMediaGroup response:",
            JSON.stringify(result)
        );


        if (!result.ok) {

            console.error(
                "❌ Telegram rejected jathagam album"
            );
        }


        lastResult = result;
    }


    return lastResult;
}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}
